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

      // 既存のダンジョン統計データの取得
      const currentDungeon = await tx.dungeon.findUnique({
        where: { id: dungeonId },
        select: {
          difficulty: true,
          clearPlayCount: true,
          failurePlayCount: true,
          interruptPlayCount: true,
          totalClearTime: true,
        },
      });

      const prevClearCount = currentDungeon?.clearPlayCount ?? 0;
      const prevFailureCount = currentDungeon?.failurePlayCount ?? 0;
      const prevInterruptCount = currentDungeon?.interruptPlayCount ?? 0;
      const prevTotalClearTime = currentDungeon?.totalClearTime ?? 0;

      // 今回クリアならカウントとクリア時間を加算、違えばそのままの値を維持
      const newClearCount = isClear ? prevClearCount + 1 : prevClearCount;
      const newFailureCount = playStatus === PlayStatus.FAILURE ? prevFailureCount + 1 : prevFailureCount;
      const newInterruptCount = playStatus === PlayStatus.INTERRUPT ? prevInterruptCount + 1 : prevInterruptCount;
      const newTotalClearTime = isClear ? prevTotalClearTime + playTime : prevTotalClearTime;

      // 平均踏破時間の算出
      const newAverageClearTime = newClearCount > 0 ? parseFloat((newTotalClearTime / newClearCount).toFixed(3)) : 0;

      const totalPlays = newClearCount + newFailureCount + newInterruptCount;
      let newDifficulty = currentDungeon?.difficulty ?? 3.0;
      // 難易度算出
      if (totalPlays >= 10) {
        // 指標A：クリア率によるベース難易度 (1.0 〜 5.0)
        const clearRate = newClearCount / totalPlays;
        const rateScore = 5.0 - clearRate * 4.0;

        // 指標B：平均クリア時間の絶対値による補正
        const avgTime = newClearCount > 0 ? newTotalClearTime / newClearCount : 0;

        // 平均時間に応じた補正値
        // タイムが長いほど難易度を少し底上げする
        const timeBonus = Math.min(avgTime / 300, 1.0) * 1.0;

        // 指標Aと指標Bを8:2で調整
        let calculated = rateScore * 0.8 + timeBonus * 2.0;

        // 1.0 〜 5.0 の範囲に収め、小数点第1位までに丸める
        newDifficulty = Math.round(Math.min(Math.max(calculated, 1.0), 5.0) * 10) / 10;
      }

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
          difficulty: newDifficulty,
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
