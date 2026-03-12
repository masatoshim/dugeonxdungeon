import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/_libs/auth";
import { UserResponse } from "@/app/_types";
import { Prisma } from "@prisma/client";

// GET: ユーザー詳細取得
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 認証セッションを取得して「管理者かどうか」を確認
    const session = await getServerSession(authOptions);
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
            dungeon: {
              select: {
                id: true,
                code: true,
                createdAt: true,
              },
            },
          },
        },
        favouriteDungeons: {
          select: {
            dungeon: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "ユーザーが見つかりません" }, { status: 404 });
    }

    const response: UserResponse = {
      id: user.id,
      userName: user.userName,
      nickName: user.nickName,
      iconImageKey: user.iconImageKey,
      // 統計情報
      ranking: user.ranking,
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
      dungeons: user.dungeons.map((d) => ({ id: d.id, code: d.code })),
      favouriteDungeons: user.favouriteDungeons.map((f) => ({ id: f.dungeon.id, code: f.dungeon.code })),
      playHistories: user.playHistories.map((p) => ({
        id: p.dungeon.id,
        code: p.dungeon.code,
        createdAt: p.dungeon.createdAt?.toISOString(),
      })),
      // 管理者のみ、または本人のみ取得可能にする項目
      ...((isOwner || isAdmin) && {
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? undefined,
        email: user.email,
        emailVerified: user.emailVerified?.toISOString() ?? undefined,
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
