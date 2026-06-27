import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_libs/auth";
import { prisma } from "@/app/_libs/prisma";
import { DungeonResponse, DungeonsIndexResponse } from "@/app/_types";
import { DungeonStatus } from "@prisma/client";
import { mapDataSchema } from "@/types/game";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
  }

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
            include: {
              user: { select: { nickName: true, iconImageKey: true } },
              dungeonTags: { include: { tag: true } },
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
        include: {
          user: { select: { nickName: true, iconImageKey: true } },
          dungeonTags: { include: { tag: true } },
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
      const { user, playHistories, favoritedBy, dungeonTags, ...rest } = d;
      const parsedMapData = mapDataSchema.safeParse(d.mapData);
      const validMapData = parsedMapData.success
        ? parsedMapData.data
        : { tiles: [], entities: [], width: 0, height: 0 };

      return {
        ...rest,
        mapData: validMapData,
        nickName: user.nickName || "USER_NAME",
        userIconImageKey: user.iconImageKey,
        totalPlayCount: d.clearPlayCount + d.failurePlayCount + d.interruptPlayCount,
        isCleared: (playHistories?.length ?? 0) > 0,
        clearedVersionMajor: playHistories?.[0]?.versionMajor,
        clearedVersionMinor: playHistories?.[0]?.versionMinor,
        isFavorited: (favoritedBy?.length ?? 0) > 0,
        tags: dungeonTags.map((dt) => dt.tag.name),
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
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
