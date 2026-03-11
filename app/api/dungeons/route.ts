import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/_libs/auth";
import { DungeonResponse, DungeonsIndexResponse, CreateDungeonRequest } from "@/app/_types";
import { DungeonStatus, PlayStatus, Prisma } from "@prisma/client";

// GET: ダンジョン一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    // 認証セッションの取得
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const isAdmin = session?.user?.role === "ADMIN";

    // ページネーション・ソート設定
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const index = Number(searchParams.get("index") || 0);
    const sortField = searchParams.get("sort") || "createdAt";
    const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";

    //検索条件の動的構築
    const andConditions: Prisma.DungeonWhereInput[] = [];

    // status検索
    const statusParam = searchParams.get("statusList");
    const statusList = statusParam ? (statusParam.split(",") as DungeonStatus[]) : [];
    if (isAdmin) {
      // 【管理者】
      // statusList が指定されていればその状態に絞り込み、なければ全件
      if (statusList.length > 0) {
        andConditions.push({ status: { in: statusList } });
      }
    } else {
      // 【一般ユーザー】
      // 基本は「公開済み」 or 「自分自身のもの」
      andConditions.push({ OR: [{ status: "PUBLISHED" }, ...(userId ? [{ userId: userId }] : [])] });
      // さらに一般ユーザーが「自分の下書きだけ見たい」などの指定をした場合
      if (statusList.length > 0) {
        andConditions.push({ status: { in: statusList } });
      }
    }

    // 文字列部分一致
    if (searchParams.get("code")) andConditions.push({ code: { contains: searchParams.get("code")! } });
    if (searchParams.get("name")) andConditions.push({ name: { contains: searchParams.get("name")! } });
    // user検索用のオブジェクトを準備
    const userFilter: Prisma.UserWhereInput = {};
    if (searchParams.get("userName")) {
      userFilter.userName = { contains: searchParams.get("userName")! };
    }
    if (searchParams.get("nickName")) {
      userFilter.nickName = { contains: searchParams.get("nickName")! };
    }
    if (Object.keys(userFilter).length > 0) {
      andConditions.push({ user: { is: userFilter } });
    }

    // 横断検索 (text)
    const searchText = searchParams.get("text");
    if (searchText) {
      andConditions.push({ OR: [{ name: { contains: searchText } }, { description: { contains: searchText } }] });
    }

    // 範囲フィルター用ヘルパー
    const addRangeFilter = (field: Extract<keyof Prisma.DungeonWhereInput, string>, type: "number" | "date") => {
      const val = searchParams.get(field);
      const from = searchParams.get(`${field}From`);
      const to = searchParams.get(`${field}To`);

      if (val || from || to) {
        const transform = (v: string) => (type === "number" ? Number(v) : new Date(v));
        if (val) {
          andConditions.push({
            [field]: transform(val),
          });
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

    // 数値項目の実行
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
        "favouritesCount",
      ] as const
    ).forEach((field) => addRangeFilter(field, "number"));
    // 日付項目の実行
    (["publishedAt", "createdAt", "updatedAt"] as const).forEach((field) => addRangeFilter(field, "date"));

    // リスト取得制限 (isTemplate / deletedFlg)
    const setListFilter = (field: keyof Prisma.DungeonWhereInput, param: string) => {
      const list = searchParams.getAll(param);
      if (list.length > 0) {
        andConditions.push({ [field]: { in: list.map((v) => v === "true") } });
      }
    };
    setListFilter("difficulty", "difficultyList");
    setListFilter("isTemplate", "isTemplateList");
    setListFilter("deletedFlg", "deletedFlgList");

    // プレイ状況による絞り込みロジック
    const playStatusParam = searchParams.get("playStatusList");
    if (userId && playStatusParam) {
      const playStatusList = playStatusParam.split(",") as PlayStatus[];

      if (playStatusList.length > 0) {
        const wantCleared = playStatusList.includes("CLEAR");
        // "NOT_CLEARED" という指定、または CLEAR を含まずに他のステータスを指定した場合の判定
        const isSeekingNotCleared = !wantCleared || playStatusList.includes("NOT_CLEARED" as any);

        if (isSeekingNotCleared && playStatusList.length === 1 && playStatusList[0] === ("NOT_CLEARED" as any)) {
          // 未攻略のみ検索
          andConditions.push({
            playHistories: { none: { userId, playStatus: "CLEAR" } },
          });
        } else {
          // 指定されたステータス（FAILUREなど）の履歴があるものを検索
          andConditions.push({
            playHistories: {
              some: { userId, playStatus: { in: playStatusList.filter((s) => s !== ("NOT_CLEARED" as any)) } },
            },
          });
          // かつ、一度でもクリアしているものは除外する
          if (isSeekingNotCleared) {
            andConditions.push({
              playHistories: { none: { userId, playStatus: "CLEAR" } },
            });
          }
        }
      }
    }

    // お気に入りによる絞り込みロジック
    if (userId && searchParams.get("isFavouritesList")) {
      const isFavouritesParam = searchParams.get("isFavouritesList")?.split(",") || [];
      const includeFavourites = isFavouritesParam.includes("true");
      const includeNotFavourites = isFavouritesParam.includes("false");
      // true と false の両方が指定されている、または指定がない場合は絞り込み不要
      if (includeFavourites !== includeNotFavourites) {
        if (includeFavourites) {
          // お気に入り登録しているものだけを表示 (some)
          andConditions.push({
            favouritedBy: {
              some: {
                userId: userId,
              },
            },
          });
        } else if (includeNotFavourites) {
          // お気に入り登録していないものだけを表示 (none)
          andConditions.push({
            favouritedBy: {
              none: {
                userId: userId,
              },
            },
          });
        }
      }
    }

    // DB実行 (合計件数とデータ取得)
    const [totalCount, dungeonsRaw] = await Promise.all([
      prisma.dungeon.count({ where: { AND: andConditions } }),
      prisma.dungeon.findMany({
        where: { AND: andConditions },
        include: {
          user: { select: { userName: true, nickName: true } },
          dungeonTags: { include: { tag: true } },
        },
        orderBy: { [sortField]: sortOrder },
        take: limit,
        skip: index,
      }),
    ]);

    // 後処理 (totalPlayCountの計算と平坦化)
    let dungeons: DungeonResponse[] = dungeonsRaw.map((d) => ({
      ...d,
      totalPlayCount: d.clearPlayCount + d.failurePlayCount + d.interruptPlayCount,
      tags: d.dungeonTags.map((dt) => dt.tag.name),
      dungeonTags: undefined,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      userName: d.user.userName,
      nickName: d.user.nickName,
    }));

    // totalPlayCountによる絞り込み（メモリ上でのフィルタリング）
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

    // レスポンス
    const responseBody: DungeonsIndexResponse = {
      dungeons,
      meta: {
        totalCount,
        index,
        limit,
        hasNext: index + limit < totalCount,
      },
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("GET Dungeons Error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

// POST: ダンジョン新規作成
export async function POST(request: Request) {
  try {
    // セッション（ログインユーザー）の確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 0 });
    }

    // リクエストボディの取得
    const body: CreateDungeonRequest = await request.json();
    const { tagIds, ...dungeonData } = body;

    // ダンジョン作成と、タグの中間テーブル保存を同時に行う
    const newDungeon = await prisma.dungeon.create({
      data: {
        ...dungeonData,
        userId: session.user.id, // ログイン中のユーザーIDを強制セット
        // 中間テーブル（DungeonTag）への紐付け
        dungeonTags: {
          create: tagIds?.map((id) => ({
            tag: { connect: { id } },
          })),
        },
      },
    });

    return NextResponse.json(newDungeon, { status: 201 });
  } catch (error) {
    console.error("Dungeon Creation Error:", error);

    // Prismaのユニーク制約違反（codeの重複など）
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ message: "指定されたダンジョンコードは既に使用されています" }, { status: 409 });
      }
    }

    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
