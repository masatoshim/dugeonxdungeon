import { NextResponse } from "next/server";
import { authOptions } from "@/app/_libs/auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/app/_libs/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ message: "認証が必要です" }, { status: 401 });

  try {
    const { id: dungeonId } = await params;

    const result = await prisma.$transaction(async (tx) => {
      // すでにお気に入り登録されているか確認
      const existingFavorite = await tx.favoritesDungeon.findUnique({
        where: {
          userId_dungeonId: { userId, dungeonId },
        },
      });

      if (existingFavorite) {
        // --- 解除処理 ---
        await tx.favoritesDungeon.delete({
          where: { id: existingFavorite.id },
        });

        const updatedDungeon = await tx.dungeon.update({
          where: { id: dungeonId },
          data: { favoritesCount: { decrement: 1 } },
        });

        return { isFavorited: false, count: updatedDungeon.favoritesCount };
      } else {
        // --- 登録処理 ---
        await tx.favoritesDungeon.create({
          data: { userId, dungeonId },
        });

        const updatedDungeon = await tx.dungeon.update({
          where: { id: dungeonId },
          data: { favoritesCount: { increment: 1 } },
        });

        return { isFavorited: true, count: updatedDungeon.favoritesCount };
      }
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Favorite Toggle Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
