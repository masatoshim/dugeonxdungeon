import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/_libs/auth";
import { DungeonResponse, UpdateDungeonRequest, UpdateDungeonResponse } from "@/app/_types";
import { Prisma } from "@prisma/client";

// GET: ダンジョン詳細取得
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 認証セッションの取得
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const isAdmin = session?.user?.role === "ADMIN";

    const { id } = await params;
    const andConditions: Prisma.DungeonWhereInput = { id };
    if (!isAdmin) {
      // 【一般ユーザー & 未登録ユーザー】
      // 基本は「公開済み」 or 「自分自身のもの」
      andConditions.OR = [{ status: "PUBLISHED" }, ...(userId ? [{ userId: userId }] : [])];
    }

    // ダンジョンの取得
    const dungeon = await prisma.dungeon.findFirst({
      where: andConditions,
      include: {
        user: { select: { userName: true, nickName: true } },
        dungeonTags: { include: { tag: true } },
      },
    });

    if (!dungeon) {
      return NextResponse.json(
        { message: "指定されたダンジョンが見つからないか、公開されていません" },
        { status: 404 },
      );
    }

    const response: DungeonResponse = {
      ...dungeon,
      totalPlayCount: dungeon.clearPlayCount + dungeon.failurePlayCount + dungeon.interruptPlayCount,
      tags: dungeon.dungeonTags.map((dt) => dt.tag.name),
      createdAt: dungeon.createdAt.toISOString(),
      updatedAt: dungeon.updatedAt.toISOString(),
      userName: dungeon.user.userName,
      nickName: dungeon.user.nickName,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Dungeon Detail Fetch Error:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

// PATCH: ダンジョン更新
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 認証セッションの取得
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateDungeonRequest = await request.json();
    const { tagIds, ...updateData } = body;

    // 権限チェック：対象のダンジョンが存在し、かつ編集権限があるか確認
    const dungeon = await prisma.dungeon.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!dungeon) {
      return NextResponse.json({ message: "ダンジョンが見つかりません" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const isOwner = dungeon.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "編集権限がありません" }, { status: 403 });
    }

    // 更新処理
    const updatedDungeon = await prisma.dungeon.update({
      where: { id },
      data: {
        ...updateData,
        // タグの更新がある場合：一度全ての紐付けを切り、新しいタグを繋ぎ直す
        dungeonTags: tagIds
          ? {
              deleteMany: {}, // 既存の中間テーブルレコードを全削除
              create: tagIds.map((tagId: number) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
    });

    const response: UpdateDungeonResponse = {
      message: "ダンジョン情報を更新しました",
      dungeon: updatedDungeon,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Dungeon Update Error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ message: "コードが重複しています" }, { status: 409 });
      }
    }
    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

// DELETE: ダンジョン削除
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 権限チェック：管理者（ADMIN）のみ許可
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "管理者権限が必要です" }, { status: 403 });
    }
    const { id } = await params;

    // 削除対象の存在確認と、現在の値を取得
    const dungeon = await prisma.dungeon.findUnique({ where: { id } });
    if (!dungeon) {
      return NextResponse.json({ message: "ダンジョンが見つかりません" }, { status: 404 });
    }

    // 削除処理
    await prisma.dungeon.delete({
      where: { id },
    });
    return NextResponse.json({ message: "ダンジョンを完全に削除しました" });
  } catch (error) {
    console.error("Dungeon Delete Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ message: "削除対象が見つかりません" }, { status: 404 });
      }
    }
    return NextResponse.json({ message: "削除に失敗しました" }, { status: 500 });
  }
}
