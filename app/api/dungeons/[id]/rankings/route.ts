import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_libs/auth";
import { DungeonRankingEntry, DungeonRankingsResponse } from "@/types";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const { id: dungeonId } = await params;

    // 各ユーザーの最高スコアを取得 (一人1枠)
    // groupByでユーザーごとに最大値を出し、上位10件を抽出
    const topScoresRaw = await prisma.playHistory.groupBy({
      by: ["userId"],
      where: {
        dungeonId: dungeonId,
        playStatus: "CLEAR",
      },
      _max: {
        playScore: true,
      },
      orderBy: {
        _max: {
          playScore: "desc",
        },
      },
      take: 10,
    });

    // ユーザー情報と最高スコアを出した時のクリアタイムを補完
    const rankings: DungeonRankingEntry[] = await Promise.all(
      topScoresRaw.map(async (item, index) => {
        const [user, bestPlay] = await Promise.all([
          prisma.user.findUnique({
            where: { id: item.userId },
            select: { nickName: true, iconImageKey: true },
          }),
          prisma.playHistory.findFirst({
            where: {
              dungeonId: dungeonId,
              userId: item.userId,
              playScore: item._max.playScore!,
              playStatus: "CLEAR",
            },
            select: { playTime: true },
            orderBy: { playTime: "asc" },
          }),
        ]);

        return {
          rank: index + 1,
          user: {
            nickName: user?.nickName || "Unknown",
            iconImageKey: user?.iconImageKey || null,
          },
          playScore: item._max.playScore ?? 0,
          clearTime: bestPlay?.playTime ?? null,
        };
      }),
    );

    // ログインユーザー自身のベスト記録と順位を取得
    let myRecord = null;
    if (userId) {
      const myBest = await prisma.playHistory.findFirst({
        where: { dungeonId, userId, playStatus: "CLEAR" },
        orderBy: { playScore: "desc" },
      });

      if (myBest) {
        // 自分より高いスコアを持つユニークなユーザー数をカウントして順位を算出
        const higherScorers = await prisma.playHistory.groupBy({
          by: ["userId"],
          where: {
            dungeonId,
            playStatus: "CLEAR",
            playScore: { gt: myBest.playScore },
          },
        });
        myRecord = {
          rank: higherScorers.length + 1,
          playScore: myBest.playScore,
          clearTime: myBest.playTime,
        };
      }
    }

    const responseBody: DungeonRankingsResponse = { rankings, myRecord };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("Ranking API Error:", error);
    return NextResponse.json({ error: "ランキングの取得に失敗しました" }, { status: 500 });
  }
}
