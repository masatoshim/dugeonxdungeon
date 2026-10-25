import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_libs/auth";
import { prisma } from "@/app/_libs/prisma";
import { DungeonResponse, DungeonsIndexResponse } from "@/app/_types";
import { DungeonStatus } from "@prisma/client";
import { mapDataSchema } from "@/game-core/schemas/map";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
  }
  const isAdmin = session?.user?.role === "ADMIN";

  // ページネーション・ソート設定
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
  const index = Number(searchParams.get("index") || 0);
  const sortField = searchParams.get("sort") || "favoritedAt";
  const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";
  const targetUserId = searchParams.get("userId") ?? sessionUserId;

  try {
    // 共通の抽出条件：公開済みかつ未削除のダンジョン
    const dungeonBaseWhere = {
      status: DungeonStatus.PUBLISHED,
      deletedFlg: false,
    };

    let dungeonsData = [];
    let totalCount = 0;

    if (sortField === "favoritedAt") {
      // ソート順が 【お気に入りに追加した順】FavoritesDungeon主体で取得
      totalCount = await prisma.favoritesDungeon.count({
        where: { userId: targetUserId, dungeon: dungeonBaseWhere },
      });

      const favorites = await prisma.favoritesDungeon.findMany({
        where: { userId: targetUserId, dungeon: dungeonBaseWhere },
        orderBy: { createdAt: sortOrder },
        take: limit,
        skip: index,
        include: {
          dungeon: {
            select: {
              id: true,
              code: true,
              name: true,
              userId: true,
              description: true,
              mapSizeHeight: true,
              mapSizeWidth: true,
              mapSize: true,
              timeLimit: true,
              difficulty: true,
              status: true,
              isTemplate: true,
              favoritesCount: true,
              createdBy: true,
              updatedBy: true,
              createdAt: true,
              updatedAt: true,
              user: { select: { userName: true, nickName: true, iconImageKey: true } },
              playHistories: {
                where: { userId: targetUserId, playStatus: "CLEAR" },
                take: 1,
              },
              favoritedBy: {
                where: { userId: targetUserId },
                take: 1,
              },
            },
          },
        },
      });
      dungeonsData = favorites.map((f) => f.dungeon);
    } else {
      // ソート順が「お気に入りに追加した順」以外の場合：Dungeon 主体で取得
      const whereCondition = {
        ...dungeonBaseWhere,
        favoritedBy: { some: { userId: targetUserId } },
      };

      totalCount = await prisma.dungeon.count({ where: whereCondition });
      dungeonsData = await prisma.dungeon.findMany({
        where: whereCondition,
        orderBy: { [sortField]: sortOrder },
        take: limit,
        skip: index,
        select: {
          id: true,
          code: true,
          name: true,
          userId: true,
          description: true,
          mapSizeHeight: true,
          mapSizeWidth: true,
          mapSize: true,
          timeLimit: true,
          difficulty: true,
          status: true,
          isTemplate: true,
          favoritesCount: true,
          createdBy: true,
          updatedBy: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { userName: true, nickName: true, iconImageKey: true } },
          playHistories: {
            where: { userId: targetUserId, playStatus: "CLEAR" },
            take: 1,
          },
          favoritedBy: {
            where: { userId: targetUserId },
            take: 1,
          },
        },
      });
    }

    const dungeons: DungeonResponse[] = dungeonsData.map((d) => {
      const { user, userId, playHistories, favoritedBy, ...rest } = d;
      const hasPrivateAccess = isAdmin || sessionUserId === d.userId;

      return {
        ...rest,
        nickName: user.nickName || "USER_NAME",
        userIconImageKey: user.iconImageKey,
        isCleared: (playHistories?.length ?? 0) > 0,
        isFavorited: (favoritedBy?.length ?? 0) > 0,
        // 管理者のみ、または本人のみ取得可能にする項目
        userId: hasPrivateAccess ? userId : undefined,
        userName: hasPrivateAccess ? user.userName : undefined,
        createdBy: hasPrivateAccess ? d.createdBy : undefined,
        updatedBy: hasPrivateAccess ? d.updatedBy : undefined,
        createdAt: hasPrivateAccess ? d.createdAt.toISOString() : undefined,
        updatedAt: hasPrivateAccess ? d.updatedAt.toISOString() : undefined,
      };
    });

    // レスポンス
    const responseBody: DungeonsIndexResponse = {
      dungeons,
      meta: {
        totalCount,
        index,
        limit,
        hasNext: index + limit < totalCount,
      },
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("Fetch History Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
