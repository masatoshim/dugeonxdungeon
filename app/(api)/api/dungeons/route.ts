import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/_libs/auth";
import { DungeonResponse, DungeonsIndexResponse, CreateDungeonRequest } from "@/app/_types";
import { DungeonStatus, PlayStatus, Prisma } from "@prisma/client";
import { mapDataSchema } from "@/game-core/schemas/map";

/**
 * GET: ダンジョン一覧取得
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    // 認証セッションの取得
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id;
    const isAdmin = session?.user?.role === "ADMIN";

    // ページネーション・ソート設定
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const index = Number(searchParams.get("index") || 0);
    const sortField = searchParams.get("sort") || "createdAt";
    const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";

    // 検索条件の動的構築
    const andConditions: Prisma.DungeonWhereInput[] = [];

    // デフォルトで削除済みは除外
    if (!isAdmin) {
      andConditions.push({ deletedFlg: false });
    }

    // status検索のパース
    const statusListParam = searchParams.get("statusList");
    const statusParam = searchParams.get("status");
    const statusList = statusListParam
      ? (statusListParam.split(",") as DungeonStatus[])
      : statusParam
        ? [statusParam as DungeonStatus]
        : [];
    const targetUserId = searchParams.get("userId");
    if (isAdmin) {
      // 管理者は指定があれば絞り込み、なければ全件
      if (statusList.length > 0) andConditions.push({ status: { in: statusList } });
      if (targetUserId) andConditions.push({ userId: targetUserId });
    } else {
      // 一般・未ログインユーザー
      if (targetUserId) {
        if (targetUserId === sessionUserId) {
          if (statusList.length > 0) andConditions.push({ status: { in: statusList } });
          andConditions.push({ userId: targetUserId });
        } else {
          andConditions.push({ status: "PUBLISHED", userId: targetUserId });
        }
      } else {
        // ユーザーID指定なしの一覧画面
        if (statusList.length > 0) {
          // パラメータで指定がある場合
          // ただし自分のもの以外は PUBLISHED 以外見せないガードが必要
          andConditions.push({
            OR: [
              { status: { in: statusList.filter((s) => s === "PUBLISHED") } }, // 公開済み
              ...(sessionUserId ? [{ userId: sessionUserId, status: { in: statusList } }] : []), // 自分のなら指定通り
            ],
          });
        } else {
          // パラメータ指定がない場合の「デフォルト」
          andConditions.push({
            OR: [{ status: "PUBLISHED" }, ...(sessionUserId ? [{ userId: sessionUserId }] : [])],
          });
        }
      }
    }

    // 作成者・更新者で検索
    if (searchParams.get("createdBy")) andConditions.push({ createdBy: searchParams.get("createdBy")! });
    if (searchParams.get("updatedBy")) andConditions.push({ updatedBy: searchParams.get("updatedBy")! });

    // 文字列部分一致
    if (searchParams.get("code")) andConditions.push({ code: { contains: searchParams.get("code")! } });
    if (searchParams.get("name")) andConditions.push({ name: { contains: searchParams.get("name")! } });
    // user検索用のオブジェクトを準備
    const userFilter: Prisma.UserWhereInput = {};
    if (isAdmin && searchParams.get("userName")) userFilter.userName = { contains: searchParams.get("userName")! };
    if (searchParams.get("nickName")) userFilter.nickName = { contains: searchParams.get("nickName")! };
    if (Object.keys(userFilter).length > 0) andConditions.push({ user: userFilter });

    // 横断検索 (text)
    const searchText = searchParams.get("text");
    if (searchText) {
      andConditions.push({ OR: [{ name: { contains: searchText } }, { description: { contains: searchText } }] });
    }

    // 範囲フィルター用ヘルパー関数
    const addRangeFilter = (field: Extract<keyof Prisma.DungeonWhereInput, string>, type: "number" | "date") => {
      const val = searchParams.get(field);
      const from = searchParams.get(`${field}From`);
      const to = searchParams.get(`${field}To`);

      if (val || from || to) {
        const transform = (v: string) => (type === "number" ? Number(v) : new Date(v));
        if (val) {
          andConditions.push({ [field]: transform(val) });
        } else {
          andConditions.push({
            [field]: {
              ...(from && { gte: transform(from) }),
              ...(to && { lte: transform(to) }),
            },
          });
        }
      }
    };

    // 範囲検索の自動適用
    (
      [
        "mapSizeHeight",
        "mapSizeWidth",
        "mapSize",
        "timeLimit",
        "difficulty",
        "clearPlayCount",
        "failurePlayCount",
        "interruptPlayCount",
        "totalPlayTime",
        "totalPlayScore",
        "favoritesCount",
      ] as const
    ).forEach((field) => addRangeFilter(field, "number"));
    // 日付項目の実行
    (["publishedAt", "createdAt", "updatedAt"] as const).forEach((field) => addRangeFilter(field, "date"));

    // フラグ項目検索のヘルパー
    const setListFilter = (field: keyof Prisma.DungeonWhereInput, param: string) => {
      const list = searchParams.getAll(param);
      if (list.length > 0) andConditions.push({ [field]: { in: list.map((v) => v === "true") } });
    };
    setListFilter("isTemplate", "isTemplateList");
    setListFilter("deletedFlg", "deletedFlgList");

    if (searchParams.get("isTemplate")) andConditions.push({ isTemplate: searchParams.get("isTemplate") === "true" });
    if (searchParams.get("deletedFlg")) andConditions.push({ deletedFlg: searchParams.get("deletedFlg") === "true" });

    const difficultyListParam = searchParams.get("difficultyList");
    if (difficultyListParam) {
      const difficultyList = difficultyListParam.split(",").map(Number);
      andConditions.push({ difficulty: { in: difficultyList } });
    }

    // プレイ状況による絞り込みロジック
    const playStatusListParam = searchParams.get("playStatusList");
    const playStatusParam = searchParams.get("playStatus");
    const playStatusList = playStatusListParam
      ? (playStatusListParam.split(",") as PlayStatus[])
      : playStatusParam
        ? [playStatusParam as PlayStatus]
        : [];

    if (sessionUserId && playStatusList.length > 0) {
      const wantCleared = playStatusList.includes("CLEAR");
      // "NOT_CLEARED" という指定、または CLEAR を含まずに他のステータスを指定した場合の判定
      const isSeekingNotCleared = !wantCleared || playStatusList.includes("NOT_CLEARED" as any);

      if (isSeekingNotCleared && playStatusList.length === 1 && playStatusList[0] === ("NOT_CLEARED" as any)) {
        // 未攻略のみ検索
        andConditions.push({
          playHistories: { none: { userId: sessionUserId, playStatus: "CLEAR" } },
        });
      } else {
        // 指定されたステータスの履歴があるものを検索
        andConditions.push({
          playHistories: {
            some: {
              userId: sessionUserId,
              playStatus: { in: playStatusList.filter((s) => s !== ("NOT_CLEARED" as any)) },
            },
          },
        });
        // かつ、一度でもクリアしているものは除外する
        if (isSeekingNotCleared) {
          andConditions.push({ playHistories: { none: { userId: sessionUserId, playStatus: "CLEAR" } } });
        }
      }
    }

    // お気に入りによる絞り込みロジック
    if (sessionUserId && searchParams.get("isFavoritesList")) {
      const isFavoritesParam = searchParams.get("isFavoritesList")?.split(",") || [];
      const includeFavorites = isFavoritesParam.includes("true");
      const includeNotFavorites = isFavoritesParam.includes("false");
      // true と false の両方が指定されている、または指定がない場合は絞り込み不要
      if (includeFavorites !== includeNotFavorites) {
        if (includeFavorites) {
          // お気に入り登録しているものだけを表示
          andConditions.push({
            favoritedBy: {
              some: {
                userId: sessionUserId,
              },
            },
          });
        } else if (includeNotFavorites) {
          // お気に入り登録していないものだけを表示
          andConditions.push({
            favoritedBy: {
              none: {
                userId: sessionUserId,
              },
            },
          });
        }
      }
    }

    // 判定対象のユーザーIDを決定
    const targetCheckUserId = searchParams.get("checkUserId");
    const effectiveCheckUserId = isAdmin && targetCheckUserId ? targetCheckUserId : sessionUserId;

    // DB実行
    const [totalCount, dungeonsRaw] = await Promise.all([
      prisma.dungeon.count({ where: { AND: andConditions } }),
      prisma.dungeon.findMany({
        where: { AND: andConditions },
        include: {
          user: { select: { userName: true, nickName: true, iconImageKey: true } },
          dungeonTags: { include: { tag: true } },
          // ログイン中ユーザーの「クリア実績」があるか（Ver問わず1件あればOK）
          playHistories: effectiveCheckUserId
            ? {
                where: { userId: effectiveCheckUserId, playStatus: "CLEAR" },
                take: 1,
                select: { id: true, versionMajor: true, versionMinor: true },
              }
            : false,
          // ログイン中ユーザーの「お気に入り」があるか
          favoritedBy: effectiveCheckUserId
            ? {
                where: { userId: effectiveCheckUserId },
                take: 1,
                select: { userId: true },
              }
            : false,
        },
        orderBy: { [sortField]: sortOrder },
        take: limit,
        skip: index,
      }),
    ]);

    // マッピング処理
    let dungeons: DungeonResponse[] = dungeonsRaw.map((d) => {
      const { user, playHistories, favoritedBy, dungeonTags, ...rest } = d;
      const hasPrivateAccess = isAdmin || sessionUserId === d.userId;
      const parsedMapData = mapDataSchema.parse(d.mapData);

      return {
        ...rest,
        mapData: parsedMapData,
        totalPlayCount: d.clearPlayCount + d.failurePlayCount + d.interruptPlayCount,
        tags: d.dungeonTags.map((dt) => dt.tag.name),
        isCleared: (playHistories?.length ?? 0) > 0,
        clearedVersionMajor: playHistories?.[0]?.versionMajor,
        clearedVersionMinor: playHistories?.[0]?.versionMinor,
        isFavorited: (favoritedBy?.length ?? 0) > 0,
        nickName: user.nickName,
        userIconImageKey: user.iconImageKey,
        // 管理者のみ、または本人のみ取得可能にする項目
        userName: hasPrivateAccess ? user.userName : undefined,
        createdBy: hasPrivateAccess ? d.createdBy : undefined,
        updatedBy: hasPrivateAccess ? d.updatedBy : undefined,
        createdAt: hasPrivateAccess ? d.createdAt.toISOString() : undefined,
        updatedAt: hasPrivateAccess ? d.updatedAt.toISOString() : undefined,
      };
    });

    const tpc = searchParams.get("totalPlayCount");
    const tpcFrom = searchParams.get("totalPlayCountFrom");
    const tpcTo = searchParams.get("totalPlayCountTo");
    if (tpc || tpcFrom || tpcTo) {
      dungeons = dungeons.filter((d) => {
        if (tpc && d.totalPlayCount !== Number(tpc)) return false;
        if (tpcFrom && d.totalPlayCount < Number(tpcFrom)) return false;
        if (tpcTo && d.totalPlayCount > Number(tpcTo)) return false;
        return true;
      });
    }

    return NextResponse.json({
      dungeons,
      meta: {
        totalCount,
        index,
        limit,
        hasNext: index + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("GET Dungeons Error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

/**
 * POST: ダンジョン新規作成
 */
export async function POST(request: Request) {
  try {
    // セッション（ログインユーザー）の確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    // リクエストボディの取得
    const body: CreateDungeonRequest = await request.json();
    const { userId, mapData, tagIds, ...dungeonData } = body;

    // 基本データチェック
    if (!mapData || !mapData.tiles || mapData.width === undefined || mapData.height === undefined) {
      return NextResponse.json({ error: "不正な mapData 構造です" }, { status: 400 });
    }

    const parsedMapData = mapDataSchema.safeParse(mapData);
    if (!parsedMapData.success) {
      return NextResponse.json(
        { error: "マップデータのバリデーションに失敗しました", details: parsedMapData.error.format() },
        { status: 400 },
      );
    }

    // ユーザーの設定している作成上限（createDungeonLimit）を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createDungeonLimit: true },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 削除（DELETED）されていない、現在のダンジョン作成数をカウント
    const activeDungeonCount = await prisma.dungeon.count({
      where: {
        userId: userId,
        status: {
          not: "DELETED", // DELETEDは含まない
        },
      },
    });

    // 上限を超えている場合はエラーを返す
    if (activeDungeonCount >= user.createDungeonLimit) {
      return NextResponse.json(
        {
          message: `ダンジョンの作成上限（最大 ${user.createDungeonLimit} 個）に達しているため、新しく作成できません。`,
          limit: user.createDungeonLimit,
          current: activeDungeonCount,
        },
        { status: 403 }, // 権限/制限エラーのため403 Forbiddenを返す
      );
    }

    // 新規作成実行
    const newDungeon = await prisma.dungeon.create({
      data: {
        ...dungeonData,
        code: dungeonData.code || `DN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        mapData: parsedMapData.data,
        user: { connect: { id: userId } },
        dungeonTags:
          tagIds && tagIds.length > 0
            ? {
                create: tagIds.map((id) => ({
                  tag: { connect: { id } },
                })),
              }
            : undefined,
      },
    });

    return NextResponse.json(newDungeon, { status: 201 });
  } catch (error) {
    console.error("Dungeon Creation Error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "指定されたダンジョンコードは既に使用されています" }, { status: 409 });
    }
    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
