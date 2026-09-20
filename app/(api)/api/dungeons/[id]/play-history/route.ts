import { NextResponse } from "next/server";
import { authOptions } from "@/app/_libs/auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/app/_libs/prisma";
import { CreatePlayHistoryRequest } from "@/app/_types/dungeon";
import { PlayStatus } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ message: "認証が必要です" }, { status: 0 });
  }

  try {
    const { id: dungeonId } = await params;
    const { playTime, playScore, playStatus, versionMajor, versionMinor }: CreatePlayHistoryRequest = await req.json();
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
          versionMajor: versionMajor,
          versionMinor: versionMinor,
        },
      });

      // クリア時の新しい累積値と平均値を計算するための事前データ取得
      const currentDungeon = await tx.dungeon.findUnique({
        where: { id: dungeonId },
        select: { clearPlayCount: true, totalClearTime: true },
      });

      const prevClearCount = currentDungeon?.clearPlayCount ?? 0;
      const prevTotalClearTime = currentDungeon?.totalClearTime ?? 0;

      // 今回クリアならカウントとクリア時間を加算、違えばそのままの値を維持
      const newClearCount = isClear ? prevClearCount + 1 : prevClearCount;
      const newTotalClearTime = isClear ? prevTotalClearTime + playTime : prevTotalClearTime;

      // 平均踏破時間の算出
      const newAverageClearTime = newClearCount > 0 ? parseFloat((newTotalClearTime / newClearCount).toFixed(3)) : 0;

      // ダンジョン統計の更新
      await tx.dungeon.update({
        where: { id: dungeonId },
        data: {
          updatedBy: userId,
          clearPlayCount: {
            increment: isClear ? 1 : 0,
          },
          failurePlayCount: {
            increment: playStatus === PlayStatus.FAILURE ? 1 : 0,
          },
          interruptPlayCount: {
            increment: playStatus === PlayStatus.INTERRUPT ? 1 : 0,
          },
          totalPlayTime: {
            increment: playTime, // 全プレイの合計時間
          },
          totalPlayScore: {
            increment: playScore,
          },
          // クリア時のみ累計クリア時間を加算
          totalClearTime: {
            increment: isClear ? playTime : 0,
          },
          // 計算した平均踏破時間を更新
          averageClearTime: newAverageClearTime,
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
