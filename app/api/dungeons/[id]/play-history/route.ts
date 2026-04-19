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

      return history;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("PlayHistory Update Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
