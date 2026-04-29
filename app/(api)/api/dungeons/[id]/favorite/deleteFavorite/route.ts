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
        // すでにお気に入り登録されているか確認
        const existing = await tx.favoritesDungeon.findUnique({
          where: { userId_dungeonId: { userId, dungeonId } },
        });

        // すでに存在しない場合は、何もせず現在のカウントを返して終了
        if (!existing) {
          const currentDungeon = await tx.dungeon.findUnique({
            where: { id: dungeonId },
            select: { favoritesCount: true },
          });
          return { isFavorited: false, count: currentDungeon?.favoritesCount || 0, alreadyDone: true };
        }

        // --- 解除処理 ---
        await tx.favoritesDungeon.delete({
          where: { id: existing!.id },
        });
        const updatedDungeon = await tx.dungeon.update({
          where: { id: dungeonId },
          data: { favoritesCount: { decrement: 1 } },
        });
        const response: FavoriteDungeonResponse = { isFavorited: false, count: updatedDungeon.favoritesCount };
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
