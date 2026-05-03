import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_libs/auth";
import { prisma } from "@/app/_libs/prisma";
import { DungeonResponse, DungeonsIndexResponse } from "@/types";
import { DungeonStatus } from "@prisma/client";

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
  const sortField = searchParams.get("sort") || "historyCreatedAt";
  const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";

  try {
    const whereCondition = {
      AND: [
        { status: DungeonStatus.PUBLISHED },
        { deletedFlg: false },
        { playHistories: { some: { userId: sessionUserId } } },
      ],
    };

    let dungeonsData;
    let totalCount;

    if (sortField === "lastPlayed") {
      // ソート順が 【最近遊んだ順】の場合：PlayHistory 主体で取得
      totalCount = await prisma.playHistory
        .groupBy({
          by: ["dungeonId"],
          where: {
            userId: sessionUserId,
            dungeon: { status: DungeonStatus.PUBLISHED, deletedFlg: false },
          },
        })
        .then((groups) => groups.length);

      const historyData = await prisma.playHistory.findMany({
        where: {
          userId: sessionUserId,
          dungeon: { status: DungeonStatus.PUBLISHED, deletedFlg: false },
        },
        orderBy: { createdAt: sortOrder },
        distinct: ["dungeonId"],
        take: limit,
        skip: index,
        include: {
          dungeon: {
            include: {
              user: { select: { nickName: true } },
              dungeonTags: { include: { tag: true } },
              playHistories: {
                where: { userId: sessionUserId, playStatus: "CLEAR" },
                take: 1,
              },
              favoritedBy: {
                where: { userId: sessionUserId },
                take: 1,
              },
            },
          },
        },
      });
      dungeonsData = historyData.map((h) => h.dungeon);
    } else {
      // ソート順が「最近遊んだ順」以外の場合：Dungeon 主体で取得
      totalCount = await prisma.dungeon.count({
        where: whereCondition,
      });
      dungeonsData = await prisma.dungeon.findMany({
        where: whereCondition,
        orderBy: { [sortField]: sortOrder },
        take: limit,
        skip: index,
        include: {
          dungeonTags: { include: { tag: true } },
          user: { select: { nickName: true } },
          // ログイン中ユーザーの「クリア実績」
          playHistories: {
            where: {
              userId: sessionUserId,
              playStatus: "CLEAR",
            },
            take: 1,
            select: { id: true, version: true },
          },
          // ログイン中ユーザーの「お気に入り」
          favoritedBy: {
            where: { userId: sessionUserId },
            take: 1,
            select: { userId: true },
          },
        },
      });
    }

    const dungeons: DungeonResponse[] = dungeonsData.map((d) => {
      const { user, playHistories, favoritedBy, dungeonTags, ...rest } = d;

      return {
        ...rest,
        nickName: user.nickName || "USER_NAME",
        totalPlayCount: d.clearPlayCount + d.failurePlayCount + d.interruptPlayCount,
        isCleared: (playHistories?.length ?? 0) > 0,
        clearedVersion: playHistories?.[0]?.version,
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
