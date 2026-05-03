import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/_libs/auth";
import { UserResponse, UpdateUserRequest, UpdateUserResponse } from "@/types";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

/**
 * GET: ユーザー詳細取得
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 認証セッションを取得して「管理者かどうか」を確認
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const currentUserId = session?.user?.id;
    const isAdmin = session?.user?.role === "ADMIN";
    const isOwner = currentUserId === id;

    const whereCondition: Prisma.UserWhereInput = { id };
    if (!isOwner && !isAdmin) {
      whereCondition.isActive = true;
      whereCondition.deletedFlg = false;
    }

    // ユーザーの取得
    const user = await prisma.user.findFirst({
      where: whereCondition,
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
        favoriteDungeons: {
          select: {
            dungeon: {
              select: { code: true, status: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "ユーザーが見つかりません" }, { status: 404 });
    }

    const hasPrivateAccess = isAdmin || session?.user?.id === user.id;
    const response: UserResponse = {
      id: user.id,
      userName: user.userName,
      nickName: user.nickName,
      iconImageKey: user.iconImageKey,
      // 統計情報
      totalPlayScore: user.totalPlayScore,
      totalPlayTime: user.totalPlayTime,
      totalPlayCount: user.clearPlayCount + user.failurePlayCount + user.interruptPlayCount,
      playDungeonCount: user.playDungeonCount,
      clearPlayCount: user.clearPlayCount,
      failurePlayCount: user.failurePlayCount,
      interruptPlayCount: user.interruptPlayCount,
      dungeonCount: user.dungeons.length,
      publishedDungeonCount: user.dungeons.filter((d) => d.status === "PUBLISHED").length,
      // ダンジョン関連
      dungeons: user.dungeons
        .filter((d) => hasPrivateAccess || d.status === "PUBLISHED")
        .map((d) => {
          return { dungeonCode: d.code };
        }),
      playHistories: user.playHistories
        .filter((h) => hasPrivateAccess || h.dungeon.status === "PUBLISHED")
        .map((h) => {
          return { dungeonCode: h.dungeon.code, userId: h.user.id, createdAt: h.createdAt.toISOString() };
        }),
      favoriteDungeons: user.favoriteDungeons
        .filter((f) => hasPrivateAccess || f.dungeon.status === "PUBLISHED")
        .map((f) => {
          return { dungeonCode: f.dungeon.code };
        }),
      // 管理者のみ、または本人のみ取得可能にする項目
      ...(hasPrivateAccess && {
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? undefined,
        email: user.email,
        emailVerified: user.emailVerified?.toISOString() ?? undefined,
        isGoogleUser: user.hashedPassword === null,
      }),
      // 管理者のみ取得可能にする項目
      ...(isAdmin && {
        role: user.role,
        isActive: user.isActive,
        deletedFlg: user.deletedFlg,
        createdBy: user.createdBy,
        updatedBy: user.updatedBy,
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("User Detail Fetch Error:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

/**
 * PATCH: ユーザー更新
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;
    const currentUserId = session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isOwner = currentUserId === id;

    // 権限チェック（本人でも管理者でもない場合は拒否）
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "更新権限がありません" }, { status: 403 });
    }

    const body: UpdateUserRequest = await request.json();

    // 更新データの選別
    const updateData: any = {
      updatedBy: currentUserId,
    };

    if (body.nickName !== undefined) updateData.nickName = body.nickName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.iconImageKey !== undefined) updateData.iconImageKey = body.iconImageKey;

    // 本人のみ更新を許可
    if (isOwner && body.password && body.password.trim() !== "") {
      if (body.password.length < 8) {
        return NextResponse.json({ message: "パスワードは8文字以上必要です" }, { status: 400 });
      }
      // パスワードをハッシュ化して保存
      updateData.hashedPassword = await bcrypt.hash(body.password, 10);
    }

    // 管理者のみが更新可能なフィールドをマージ
    if (isAdmin) {
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
    }

    // 更新処理
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const response: UpdateUserResponse = {
      message: "ユーザー情報を更新しました",
      user: {
        id: updatedUser.id,
        userName: updatedUser.userName,
        nickName: updatedUser.nickName,
        iconImageKey: updatedUser.iconImageKey,
        // 権限に応じた項目
        ...(isAdmin || isOwner
          ? {
              email: updatedUser.email,
              role: updatedUser.role,
              isActive: updatedUser.isActive,
              deletedFlg: updatedUser.deletedFlg,
              updatedAt: updatedUser.updatedAt.toISOString(),
            }
          : {}),
      },
    };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("User Update Error:", error);

    if (error.code === "P2002") {
      return NextResponse.json({ message: "ユーザー名またはメールアドレスが既に使われています" }, { status: 409 });
    }
    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

/**
 * DELETE: ユーザー削除
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 権限チェック：管理者（ADMIN）のみ許可
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "管理者権限が必要です" }, { status: 403 });
    }
    const { id } = await params;

    // 2. 削除対象の存在確認と、現在の値を取得
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ message: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 論理削除の実行
    const now = Date.now();
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedFlg: true,
        // 重複を避ける為、リネーム
        email: `del_${now}_${user.email}`,
        userName: `del_${now}_${user.userName}`,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({ message: "ユーザーを削除しました" });
  } catch (error) {
    console.error("Delete API Error:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
