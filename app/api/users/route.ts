import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/_libs/auth";
import { Role, Prisma } from "@prisma/client";
import { UserResponse, UsersIndexResponse } from "@/app/_types";

// GET: ユーザー一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    // 認証セッションの取得
    const session = await getServerSession(authOptions);
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
        },
        take: limit,
        skip: index,
        orderBy: { [sortField]: sortOrder },
      }),
    ]);

    // 後処理
    const users: UserResponse[] = usersRaw.map((u) => ({
      ...u,
      totalPlayCount: u.clearPlayCount + u.failurePlayCount + u.interruptPlayCount,
      dungeonCount: u.dungeons.length,
      publishedDungeonCount: u.dungeons.filter((d) => d.status === "PUBLISHED").length,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      // 管理者のみ、または本人のみ取得可能にする項目
      emailVerified: isAdmin || session?.user?.id === u.id ? u.emailVerified?.toISOString() : undefined,
      lastLoginAt: isAdmin || session?.user?.id === u.id ? u.lastLoginAt?.toISOString() : undefined,
      email: isAdmin || session?.user?.id === u.id ? u.email : undefined,
      isActive: isAdmin || session?.user?.id === u.id ? u.isActive : undefined,
      deletedFlg: isAdmin || session?.user?.id === u.id ? u.deletedFlg : undefined,
    }));

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
