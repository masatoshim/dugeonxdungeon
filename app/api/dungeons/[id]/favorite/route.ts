import { NextResponse } from "next/server";
import { authOptions } from "@/app/_libs/auth";
import { getServerSession } from "next-auth";
import { FavoriteStatusResponse, CreateFavoriteDungeonResponse } from "@/types";
import { prisma } from "@/app/_libs/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) return NextResponse.json({ message: "認証が必要です" }, { status: 401 });

  const { id: dungeonId } = await params;
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId") || sessionUserId;

  try {
    const favorite = await prisma.favoritesDungeon.findUnique({
      where: {
        userId_dungeonId: {
          userId: targetUserId,
          dungeonId: dungeonId,
        },
      },
    });

    const response: FavoriteStatusResponse = {
      isFavorited: !!favorite,
      favoriteData: favorite,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Fetch Favorites Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

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

      let response: CreateFavoriteDungeonResponse;
      if (existingFavorite) {
        // --- 解除処理 ---
        await tx.favoritesDungeon.delete({
          where: { id: existingFavorite.id },
        });

        const updatedDungeon = await tx.dungeon.update({
          where: { id: dungeonId },
          data: { favoritesCount: { decrement: 1 } },
        });
        response = { isFavorited: false, count: updatedDungeon.favoritesCount };
      } else {
        // --- 登録処理 ---
        await tx.favoritesDungeon.create({
          data: { userId, dungeonId },
        });

        const updatedDungeon = await tx.dungeon.update({
          where: { id: dungeonId },
          data: { favoritesCount: { increment: 1 } },
        });
        response = { isFavorited: true, count: updatedDungeon.favoritesCount };
      }
      return response;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Favorite Toggle Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
