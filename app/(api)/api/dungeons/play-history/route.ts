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
  const sortField = searchParams.get("sort") || "historyCreatedAt";
  const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";
  const targetUserId = searchParams.get("userId") ?? sessionUserId;

  try {
    const whereCondition = {
      AND: [
        { status: DungeonStatus.PUBLISHED },
        { deletedFlg: false },
        { playHistories: { some: { userId: targetUserId } } },
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
            userId: targetUserId,
            dungeon: { status: DungeonStatus.PUBLISHED, deletedFlg: false },
          },
        })
        .then((groups) => groups.length);

      const historyData = await prisma.playHistory.findMany({
        where: {
          userId: targetUserId,
          dungeon: { status: DungeonStatus.PUBLISHED, deletedFlg: false },
        },
        orderBy: { createdAt: sortOrder },
        distinct: ["dungeonId"],
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
          // ログイン中ユーザーの「クリア実績」
          playHistories: {
            where: {
              userId: targetUserId,
              playStatus: "CLEAR",
            },
            take: 1,
            select: { id: true, versionMajor: true, versionMinor: true },
          },
          // ログイン中ユーザーの「お気に入り」
          favoritedBy: {
            where: { userId: targetUserId },
            take: 1,
            select: { userId: true },
          },
        },
      });
    }

    const dungeons: DungeonResponse[] = dungeonsData.map((d) => {
      const { user, userId, playHistories, favoritedBy, ...rest } = d;

      return {
        ...rest,
        nickName: user.nickName || "USER_NAME",
        userIconImageKey: user.iconImageKey,
        isCleared: (playHistories?.length ?? 0) > 0,
        isFavorited: (favoritedBy?.length ?? 0) > 0,
        // 管理者のみ取得可能にする項目(自作ダンジョンは履歴に残らない為、USERは取得不可)
        userId: isAdmin ? userId : undefined,
        userName: isAdmin ? user.userName : undefined,
        createdBy: isAdmin ? d.createdBy : undefined,
        updatedBy: isAdmin ? d.updatedBy : undefined,
        createdAt: isAdmin ? d.createdAt.toISOString() : undefined,
        updatedAt: isAdmin ? d.updatedAt.toISOString() : undefined,
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
