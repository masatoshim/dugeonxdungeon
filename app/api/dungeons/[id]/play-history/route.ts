import { NextResponse } from "next/server";
import { authOptions } from "@/app/_libs/auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/app/_libs/prisma";
import { CreatePlayHistoryRequest } from "@/types/dungeon";
import { PlayStatus } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ message: "認証が必要です" }, { status: 0 });
  }

  try {
    const { id: dungeonId } = await params;
    const { playTime, playScore, playStatus, version }: CreatePlayHistoryRequest = await req.json();
    const isClear = playStatus === PlayStatus.CLEAR;

    const result = await prisma.$transaction(async (tx) => {
      // プレイ履歴の作成
      const history = await tx.playHistory.create({
        data: {
          userId: userId!,
          dungeonId,
          playTime,
          playScore,
          playStatus,
          version: version || 1,
        },
      });

      // ダンジョン統計の更新
      await tx.dungeon.update({
        where: { id: dungeonId },
        data: {
          updatedBy: userId,
          clearPlayCount: {
            increment: playStatus === PlayStatus.CLEAR ? 1 : 0,
          },
          failurePlayCount: {
            increment: playStatus === PlayStatus.FAILURE ? 1 : 0,
          },
          interruptPlayCount: {
            increment: playStatus === PlayStatus.INTERRUPT ? 1 : 0,
          },
          totalPlayTime: {
            increment: playTime,
          },
          totalPlayScore: {
            increment: playScore,
          },
        },
      });

      if (isClear) {
        const currentBest = await tx.userDungeonBest.findUnique({
          where: { userId_dungeonId: { userId, dungeonId } },
        });

        const previousBestScore = currentBest?.bestScore ?? 0;
        const isNewRecord = playScore > previousBestScore;
        const scoreDiff = isNewRecord ? playScore - previousBestScore : 0;

        if (isNewRecord) {
          await tx.userDungeonBest.upsert({
            where: { userId_dungeonId: { userId, dungeonId } },
            update: { bestScore: playScore, bestTime: playTime },
            create: { userId, dungeonId, bestScore: playScore, bestTime: playTime },
          });
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            updatedBy: userId,
            clearPlayCount: { increment: 1 },
            playDungeonCount: { increment: currentBest ? 0 : 1 }, // 初回クリアのみ加算
            totalPlayTime: { increment: playTime },
            totalPlayScore: { increment: scoreDiff }, // ベスト更新分のみ加算
          },
        });
      } else {
        // クリア失敗時のユーザー統計更新
        await tx.user.update({
          where: { id: userId },
          data: {
            updatedBy: userId,
            failurePlayCount: { increment: playStatus === PlayStatus.FAILURE ? 1 : 0 },
            interruptPlayCount: { increment: playStatus === PlayStatus.INTERRUPT ? 1 : 0 },
            totalPlayTime: { increment: playTime },
          },
        });
      }

      return history;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("PlayHistory Update Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
