import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { PendingClearRequest } from "@/types";

export async function POST(req: Request) {
  try {
    const body: PendingClearRequest = await req.json();
    const { dungeonId, version, playTime, playScore } = body;

    if (!dungeonId || playTime === undefined || playScore === undefined) {
      return NextResponse.json({ message: "不正なデータです" }, { status: 400 });
    }

    // 有効期限取得
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const pending = await prisma.pendingClear.create({
      data: {
        dungeonId,
        version,
        playTime,
        playScore,
        expiresAt,
      },
    });

    return NextResponse.json({ pendingId: pending.id });
  } catch (error) {
    console.error("Pending Clear Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
