import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/_libs/auth";
import { DungeonBase, DungeonResponse, UpdateDungeonRequest, UpdateDungeonResponse } from "@/app/_types";
import { Prisma } from "@prisma/client";
import { mapDataSchema } from "@/game-core/schemas/map";

/**
 * レスポンス構造の詰め替えを一元管理する共通ヘルパー
 */
function mapToDungeonResponse(
  dungeon: Prisma.DungeonGetPayload<{
    include: {
      user: { select: { userName: true; nickName: true; iconImageKey: true } };
      dungeonTags: { include: { tag: true } };
    };
  }>,
  hasPrivateAccess: boolean,
): DungeonBase {
  const parsedMapData = mapDataSchema.parse(dungeon.mapData);

  return {
    ...dungeon,
    mapData: parsedMapData,
    tags: dungeon.dungeonTags.map((dt) => dt.tag.name),
    nickName: dungeon.user.nickName,
    userIconImageKey: dungeon.user.iconImageKey,
    userName: hasPrivateAccess ? dungeon.user.userName : undefined,
  };
}

/**
 * GET: ダンジョン詳細取得
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 認証セッションの取得
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id;
    const isAdmin = session?.user?.role === "ADMIN";

    const { id } = await params;
    const andConditions: Prisma.DungeonWhereInput = { id };
    if (!isAdmin) {
      // 【一般ユーザー & 未登録ユーザー】
      // 基本は「公開中」 or 「自分自身のもの」
      andConditions.OR = [{ status: "PUBLISHED" }, ...(sessionUserId ? [{ userId: sessionUserId }] : [])];
    }

    // ダンジョンの取得
    const dungeon = await prisma.dungeon.findFirst({
      where: andConditions,
      include: {
        user: { select: { userName: true, nickName: true, iconImageKey: true } },
        dungeonTags: { include: { tag: true } },
      },
    });

    if (!dungeon) {
      return NextResponse.json(
        { message: "指定されたダンジョンが見つからないか、公開されていません" },
        { status: 404 },
      );
    }

    const hasPrivateAccess = isAdmin || sessionUserId === dungeon.userId;
    const dungeonBase = mapToDungeonResponse(dungeon, hasPrivateAccess);

    const response: DungeonResponse = {
      ...dungeonBase,
      favoritesCount: dungeon.favoritesCount,
      clearPlayCount: dungeon.clearPlayCount,
      failurePlayCount: dungeon.failurePlayCount,
      interruptPlayCount: dungeon.interruptPlayCount,
      totalPlayCount: dungeon.clearPlayCount + dungeon.failurePlayCount + dungeon.interruptPlayCount,
      createdAt: dungeon.createdAt.toISOString(),
      updatedAt: dungeon.updatedAt.toISOString(),
      createdBy: hasPrivateAccess ? dungeon.createdBy : undefined,
      updatedBy: hasPrivateAccess ? dungeon.updatedBy : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Dungeon Detail Fetch Error:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

/**
 * PATCH: ダンジョン更新
 */
// todo: ユーザーが自由に更新されたら困るパラメータについては、別途制限を設けて、別APIを作成する
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
    const hasPrivateAccess = isAdmin || session.user.id === dungeon.userId;
    if (!hasPrivateAccess) {
      return NextResponse.json({ message: "編集権限がありません" }, { status: 403 });
    }

    // 更新処理
    const updatedDungeon = await prisma.dungeon.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: session.user.id,
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
      include: {
        user: { select: { userName: true, nickName: true, iconImageKey: true } },
        dungeonTags: { include: { tag: true } },
      },
    });

    const response: UpdateDungeonResponse = {
      message: "ダンジョン情報を更新しました",
      dungeon: mapToDungeonResponse(updatedDungeon, hasPrivateAccess),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Dungeon Update Error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "コードが重複しています" }, { status: 409 });
    }
    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

/**
 * DELETE: ダンジョン削除
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 権限チェック：管理者（ADMIN）のみ許可
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "管理者権限が必要です" }, { status: 403 });
    }
    const { id } = await params;

    // 削除処理（Prisma の既定の挙動に任せ、catch 側で存在エラーを安全にハンドル）
    await prisma.dungeon.delete({
      where: { id },
    });

    return NextResponse.json({ message: "ダンジョンを完全に削除しました" });
  } catch (error) {
    console.error("Dungeon Delete Error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "削除対象が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ message: "削除に失敗しました" }, { status: 500 });
  }
}
