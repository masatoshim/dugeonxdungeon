import { NextResponse } from "next/server";
import { authOptions } from "@/app/_libs/auth";
import { getServerSession } from "next-auth";
import { FavoriteStatusResponse } from "@/types";
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
