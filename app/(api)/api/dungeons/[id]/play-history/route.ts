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
    return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
  }

  try {
    const { id: dungeonId } = await params;
    const { playTime, playScore, playStatus, versionMajor, versionMinor }: CreatePlayHistoryRequest = await req.json();
    const isClear = playStatus === PlayStatus.CLEAR;

    const result = await prisma.$transaction(async (tx) => {
      // プレイ履歴の作成
      const history = await tx.playHistory.create({
        data: {
          userId,
          dungeonId,
          playTime,
          playScore,
          playStatus,
          versionMajor,
          versionMinor,
        },
      });

      // 更新前のUserDungeonBestを取得
      const currentBest = await tx.userDungeonBest.findUnique({
        where: { userId_dungeonId: { userId, dungeonId } },
      });

      const wasAlreadyCleared = currentBest?.hasCleared ?? false;
      const prevStatus = currentBest?.latestStatus;

      // ユニークカウントの差分の計算
      let clearDelta = 0;
      let failureDelta = 0;
      let interruptDelta = 0;

      if (isClear) {
        // 今回クリアした場合
        if (!wasAlreadyCleared) {
          // 初めてのクリアなので、ユニーク踏破数が +1
          clearDelta = 1;

          // もし過去に未クリア状態で「失敗」または「中断」としてカウントされていたなら、相殺する
          if (prevStatus === PlayStatus.FAILURE) {
            failureDelta = -1;
          } else if (prevStatus === PlayStatus.INTERRUPT) {
            interruptDelta = -1;
          }
        }
        // すでにクリア済みの場合は、何をしてもユニーク数は変わらない
      } else {
        // 今回クリア以外（失敗 または 中断）の場合
        if (!wasAlreadyCleared) {
          // まだ一度もクリアしていないダンジョンの場合のみ、失敗/中断のユニーク数に関与する
          if (playStatus === PlayStatus.FAILURE) {
            if (prevStatus === PlayStatus.INTERRUPT) {
              // 中断 → 失敗 に変わった
              interruptDelta = -1;
              failureDelta = 1;
            } else if (prevStatus !== PlayStatus.FAILURE) {
              // 初めての失敗、または履歴なし
              failureDelta = 1;
            }
          } else if (playStatus === PlayStatus.INTERRUPT) {
            if (prevStatus === PlayStatus.FAILURE) {
              // 失敗 → 中断 に変わった
              failureDelta = -1;
              interruptDelta = 1;
            } else if (prevStatus !== PlayStatus.INTERRUPT) {
              // 初めての中断、または履歴なし
              interruptDelta = 1;
            }
          }
        }
        // すでにクリア済みのダンジョンでの失敗・中断は、ユニーク失敗・中断数にはカウントしない
      }

      // ダンジョン自体の統計更新（難易度や各回数）
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

      // UserDungeonBestの更新・作成
      const previousBestScore = currentBest?.bestScore ?? 0;
      const isNewRecord = isClear && playScore > previousBestScore;
      const scoreDiff = isNewRecord ? playScore - previousBestScore : 0;
      const nextHasCleared = wasAlreadyCleared || isClear;

      await tx.userDungeonBest.upsert({
        where: { userId_dungeonId: { userId, dungeonId } },
        update: {
          ...(isNewRecord && {
            bestScore: playScore,
            bestTime: playTime,
          }),
          hasCleared: nextHasCleared,
          latestStatus: playStatus,
        },
        create: {
          userId,
          dungeonId,
          bestScore: isClear ? playScore : 0,
          bestTime: isClear ? playTime : 0,
          hasCleared: isClear,
          latestStatus: playStatus,
        },
      });

      // User テーブルの統計更新
      await tx.user.update({
        where: { id: userId },
        data: {
          updatedBy: userId,
          clearPlayCount: { increment: isClear ? 1 : 0 },
          failurePlayCount: { increment: playStatus === PlayStatus.FAILURE ? 1 : 0 },
          interruptPlayCount: { increment: playStatus === PlayStatus.INTERRUPT ? 1 : 0 },
          playDungeonCount: { increment: !wasAlreadyCleared && isClear ? 1 : 0 },
          totalPlayTime: { increment: playTime },
          totalPlayScore: { increment: scoreDiff },
          uniqueClearDungeonCount: { increment: clearDelta },
          uniqueFailureDungeonCount: { increment: failureDelta },
          uniqueInterruptDungeonCount: { increment: interruptDelta },
        },
      });

      return history;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("PlayHistory Update Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
