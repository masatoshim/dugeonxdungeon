import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_libs/auth";
import { prisma } from "@/app/_libs/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { pendingId } = await req.json();
    if (!pendingId) {
      return NextResponse.json({ message: "IDが必要です" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 一時データの取得
      const pending = await tx.pendingClear.findUnique({
        where: { id: pendingId },
      });

      // データの存在と有効期限のチェック
      if (!pending) throw new Error("データが見つかりません");
      if (new Date() > pending.expiresAt) throw new Error("有効期限切れです");

      // 正式な履歴テーブルへ保存
      const history = await tx.playHistory.create({
        data: {
          userId: session.user.id,
          dungeonId: pending.dungeonId,
          version: pending.version,
          playScore: pending.playScore,
          playTime: pending.playTime,
          playStatus: "CLEAR",
        },
      });

      // 使用済みの一時データを削除
      await tx.pendingClear.delete({
        where: { id: pendingId },
      });

      return history;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Confirm Clear Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
