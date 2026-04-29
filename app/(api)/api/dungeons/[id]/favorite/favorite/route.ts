import { NextResponse } from "next/server";
import { authOptions } from "@/app/_libs/auth";
import { getServerSession } from "next-auth";
import { FavoriteDungeonResponse } from "@/types";
import { prisma } from "@/app/_libs/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ message: "認証が必要です" }, { status: 401 });

  try {
    const { id: dungeonId } = await params;

    const result = await prisma.$transaction(
      async (tx) => {
        // 既にお気に入り登録されているか確認
        const existing = await tx.favoritesDungeon.findUnique({
          where: { userId_dungeonId: { userId, dungeonId } },
        });

        // すでに登録済みの場合は、何もせず現在のカウントを返して終了
        if (existing) {
          const currentDungeon = await tx.dungeon.findUnique({
            where: { id: dungeonId },
            select: { favoritesCount: true },
          });
          return { isFavorited: true, count: currentDungeon?.favoritesCount || 0, alreadyDone: true };
        }

        // --- 登録処理 ---
        await tx.favoritesDungeon.create({
          data: { userId, dungeonId },
        });

        const updatedDungeon = await tx.dungeon.update({
          where: { id: dungeonId },
          data: { favoritesCount: { increment: 1 } },
        });
        const response: FavoriteDungeonResponse = { isFavorited: true, count: updatedDungeon.favoritesCount };
        return response;
      },
      {
        timeout: 5000,
      },
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Favorite Toggle Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
