import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/_libs/auth";
import { Role, Prisma } from "@prisma/client";
import { UserResponse, UsersIndexResponse } from "@/app/_types";
import bcrypt from "bcrypt";
import { z } from "zod";
import { sendVerificationEmail, sendAdminAlertEmail } from "@/app/_libs/mail";

/**
 * GET: ユーザー一覧取得
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    // 認証セッションの取得
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const isAdmin = session?.user?.role === "ADMIN";

    // ページネーション・ソート設定
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const index = Number(searchParams.get("index") || 0);
    const sortField = searchParams.get("sort") || "createdAt";
    const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";

    //検索条件の動的構築
    const andConditions: Prisma.UserWhereInput[] = [];

    // 文字列部分一致
    if (searchParams.get("userName")) {
      andConditions.push({ userName: { contains: searchParams.get("userName")! } });
    }
    if (searchParams.get("nickName")) {
      andConditions.push({ nickName: { contains: searchParams.get("nickName")! } });
    }

    // Role絞り込み
    const roleParam = searchParams.get("roleList");
    if (roleParam) {
      andConditions.push({ role: { in: roleParam.split(",") as Role[] } });
    }

    // 範囲フィルター用ヘルパー
    const addRangeFilter = (field: Extract<keyof Prisma.UserWhereInput, string>, type: "number" | "date") => {
      const val = searchParams.get(field);
      const from = searchParams.get(`${field}From`);
      const to = searchParams.get(`${field}To`);

      if (val || from || to) {
        const transform = (v: string) => (type === "number" ? Number(v) : new Date(v));
        if (val) {
          andConditions.push({
            [field]: transform(val),
          });
        } else {
          andConditions.push({
            [field]: {
              ...(from && { gte: transform(from) }),
              ...(to && { lte: transform(to) }),
            },
          });
        }
      }
    };

    // 数値項目の実行
    (
      [
        "ranking",
        "clearPlayCount",
        "failurePlayCount",
        "interruptPlayCount",
        "playDungeonCount",
        "totalPlayTime",
        "totalPlayScore",
      ] as const
    ).forEach((field) => addRangeFilter(field, "number"));

    // --- 管理者専用パラメータ ---
    if (isAdmin) {
      const activeParam = searchParams.get("isActiveList");
      if (activeParam) {
        const activeValues = activeParam.split(",").map((v) => v === "true");
        andConditions.push({ OR: activeValues.map((v) => ({ isActive: v })) });
      }
      const deletedFlgParam = searchParams.get("deletedFlgList");
      if (deletedFlgParam) {
        const deletedValues = deletedFlgParam.split(",").map((v) => v === "true");
        andConditions.push({ OR: deletedValues.map((v) => ({ deletedFlg: v })) });
      }
      if (searchParams.get("createdBy"))
        andConditions.push({ createdBy: { contains: searchParams.get("createdBy")! } });
      if (searchParams.get("updatedBy"))
        andConditions.push({ updatedBy: { contains: searchParams.get("updatedBy")! } });
      // 日付項目の実行
      (["lastLoginAt", "createdAt", "updatedAt"] as const).forEach((field) => addRangeFilter(field, "date"));
    } else {
      // 一般ユーザーの場合は、削除済みでない・アクティブなユーザーのみ
      andConditions.push({ deletedFlg: false });
      andConditions.push({ isActive: true });
    }

    // ダンジョンコードによるリレーション絞り込み
    if (searchParams.get("createDungeonCodeList")) {
      andConditions.push({
        dungeons: { some: { code: { in: searchParams.get("createDungeonCodeList")!.split(",") } } },
      });
    }
    if (searchParams.get("historyDungeonCodeList")) {
      andConditions.push({
        playHistories: {
          some: { dungeon: { code: { in: searchParams.get("historyDungeonCodeList")!.split(",") } } },
        },
      });
    }
    if (searchParams.get("favouriteDungeonCodeList")) {
      andConditions.push({
        favouriteDungeons: {
          some: { dungeon: { code: { in: searchParams.get("favouriteDungeonCodeList")!.split(",") } } },
        },
      });
    }

    // DB実行 (合計件数とデータ取得)
    const [totalCount, usersRaw] = await Promise.all([
      prisma.user.count({ where: { AND: andConditions } }),
      prisma.user.findMany({
        where: { AND: andConditions },
        include: {
          dungeons: {
            select: {
              id: true,
              code: true,
              status: true,
            },
          },
          playHistories: {
            select: {
              createdAt: true,
              dungeon: {
                select: { code: true, status: true },
              },
              user: {
                select: { id: true },
              },
            },
          },
          favouriteDungeons: {
            select: {
              dungeon: {
                select: { code: true, status: true },
              },
            },
          },
        },
        take: limit,
        skip: index,
        orderBy: { [sortField]: sortOrder },
      }),
    ]);

    // 後処理
    const users: UserResponse[] = usersRaw.map((u) => {
      const { hashedPassword, ...rest } = u;
      const hasPrivateAccess = isAdmin || session?.user?.id === u.id;
      return {
        ...rest,
        dungeons: u.dungeons
          .filter((d) => hasPrivateAccess || d.status === "PUBLISHED")
          .map((d) => {
            return { dungeonCode: d.code };
          }),
        playHistories: u.playHistories
          .filter((h) => hasPrivateAccess || h.dungeon.status === "PUBLISHED")
          .map((h) => {
            return { dungeonCode: h.dungeon.code, userId: h.user.id, createdAt: h.createdAt.toISOString() };
          }),
        favouriteDungeons: u.favouriteDungeons
          .filter((f) => hasPrivateAccess || f.dungeon.status === "PUBLISHED")
          .map((f) => {
            return { dungeonCode: f.dungeon.code };
          }),
        totalPlayCount: u.clearPlayCount + u.failurePlayCount + u.interruptPlayCount,
        publishedDungeonCount: u.dungeons.filter((d) => d.status === "PUBLISHED").length,
        // 管理者のみ、または本人のみ取得可能にする項目
        dungeonCount: hasPrivateAccess ? u.dungeons.length : undefined,
        createdBy: hasPrivateAccess ? u.createdBy : undefined,
        updatedBy: hasPrivateAccess ? u.updatedBy : undefined,
        createdAt: hasPrivateAccess ? u.createdAt.toISOString() : undefined,
        updatedAt: hasPrivateAccess ? u.updatedAt.toISOString() : undefined,
        emailVerified: hasPrivateAccess ? u.emailVerified?.toISOString() : undefined,
        lastLoginAt: hasPrivateAccess ? u.lastLoginAt?.toISOString() : undefined,
        email: hasPrivateAccess ? u.email : undefined,
        isActive: hasPrivateAccess ? u.isActive : undefined,
        deletedFlg: hasPrivateAccess ? u.deletedFlg : undefined,
        role: hasPrivateAccess ? u.role : undefined,
      };
    });

    // レスポンス
    const response: UsersIndexResponse = {
      users,
      meta: { totalCount, index, limit, hasNext: index + limit < totalCount },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("User List Error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

// バリデーションスキーマの定義
const passwordSchema = z
  .string()
  .min(8, "8文字以上で入力してください")
  .max(100) // 念のための上限
  .regex(/[a-z]/, "小文字を含めてください")
  .regex(/[A-Z]/, "大文字を含めてください")
  .regex(/[0-9]/, "数字を含めてください");

/**
 * POST: ユーザー新規登録
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userName, email, password } = body;

    // パスワードチェック
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      return NextResponse.json({ message: result.error.message }, { status: 400 });
    }

    // バリデーション
    if (!userName || !email || !password) {
      return NextResponse.json({ message: "必須項目が不足しています" }, { status: 400 });
    }

    // 重複チェック
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ userName: userName }, { email: email }],
        deletedFlg: false, // 論理削除されていないユーザーのみチェック
      },
    });

    if (existingUser) {
      return NextResponse.json({ message: "ユーザー名またはメールアドレスが既に登録されています" }, { status: 409 });
    }

    // パスワードハッシュ化とトークンの有効期限の設定
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 有効期限

    const now = new Date();

    // ユーザー作成とトークン作成をトランザクションで実行
    const newUser = await prisma.$transaction(async (tx) => {
      // ユーザー作成
      const user = await prisma.user.create({
        data: {
          userName,
          nickName: userName,
          email,
          hashedPassword,
          role: "USER",
          emailVerified: now,
          isActive: false, // メール認証が完了するまでログインさせない
          deletedFlg: false,
        },
      });

      // 作成後、自分自身で更新情報を入れる
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          createdBy: user.id,
          updatedBy: user.id,
        },
      });

      // トークンを保存
      await tx.verificationToken.create({
        data: {
          identifier: email,
          token: token,
          expires: expires,
        },
      });
      return updatedUser;
    });
    try {
      // 確認メールを送信
      await sendVerificationEmail(email, token);

      return NextResponse.json(
        {
          message: "確認メールを送信しました。24時間以内にリンクをクリックして登録を完了してください。",
        },
        { status: 201 },
      );
    } catch (mailError: any) {
      // Resend の制限（429 Too Many Requests）をキャッチ
      if (mailError?.status === 429) {
        // 管理者へ緊急通知
        sendAdminAlertEmail(email).catch(console.error);

        return NextResponse.json(
          {
            message:
              "現在、確認メールの送信制限に達しています。時間を置いて再度お試しいただくか、サポートへご連絡ください。",
          },
          { status: 429 },
        );
      }

      throw mailError;
    }
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
