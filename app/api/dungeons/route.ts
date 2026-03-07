import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { DungeonsIndexResponse, CreateDungeonRequest } from "@/app/_types";
import { DungeonStatus, Prisma } from "@prisma/client";

// GET: ダンジョン一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    // ページネーション・ソート設定
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const index = Number(searchParams.get("index") || 0);
    const sortField = searchParams.get("sort") || "createdAt";
    const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";
    const currentUserId = searchParams.get("currentUserId"); // 認証状況に応じて取得

    // Where句（検索条件）の動的構築
    const where: Prisma.DungeonWhereInput = {};

    // 文字列部分一致
    if (searchParams.get("code")) where.code = { contains: searchParams.get("code")! };
    if (searchParams.get("name")) where.name = { contains: searchParams.get("name")! };
    // user検索用のオブジェクトを準備
    const userFilter: Prisma.UserWhereInput = {};
    if (searchParams.get("userName")) {
      userFilter.userName = { contains: searchParams.get("userName")! };
    }
    if (searchParams.get("nickName")) {
      userFilter.nickName = { contains: searchParams.get("nickName")! };
    }
    // どちらか一方でも入力があれば、where.user をセット
    if (Object.keys(userFilter).length > 0) {
      where.user = { is: userFilter };
    }

    // 横断検索 (text)
    const searchText = searchParams.get("text");
    if (searchText) {
      where.OR = [{ name: { contains: searchText } }, { description: { contains: searchText } }];
    }

    // 数値範囲フィルター用ヘルパー
    const addRangeFilter = (field: keyof Prisma.DungeonWhereInput, param: string) => {
      const val = searchParams.get(param);
      const from = searchParams.get(`${param}From`);
      const to = searchParams.get(`${param}To`);
      if (val || from || to) {
        (where as any)[field] = {
          ...(val && { equals: Number(val) }),
          ...(from && { gte: Number(from) }),
          ...(to && { lte: Number(to) }),
        };
      }
    };

    addRangeFilter("mapSizeHeight", "mapSizeHeight");
    addRangeFilter("timeLimit", "timeLimit");
    addRangeFilter("difficulty", "difficulty");
    addRangeFilter("clearPlayCount", "clearPlayCount");
    addRangeFilter("failurePlayCount", "failurePlayCount");
    addRangeFilter("interruptPlayCount", "interruptPlayCount");
    addRangeFilter("totalPlayTime", "totalPlayTime");
    addRangeFilter("totalPlayScore", "totalPlayScore");
    addRangeFilter("favouritesCount", "favouritesCount");

    // 日付範囲
    const pDate = searchParams.get("publishedAt");
    const pFrom = searchParams.get("publishedAtFrom");
    const pTo = searchParams.get("publishedAtTo");
    if (pDate || pFrom || pTo) {
      where.publishedAt = {
        ...(pDate && { equals: new Date(pDate) }),
        ...(pFrom && { gte: new Date(pFrom) }),
        ...(pTo && { lte: new Date(pTo) }),
      };
    }

    // ステータスと権限の制御
    const reqStatus = searchParams.get("status") as DungeonStatus | null;
    if (reqStatus && reqStatus !== "PUBLISHED") {
      // 非公開情報を求めるなら「そのステータス かつ 自分のもの」である必要がある
      where.AND = [{ status: reqStatus }, { userId: currentUserId || "GUEST" }];
    } else if (reqStatus === "PUBLISHED") {
      where.status = "PUBLISHED";
    } else {
      // 指定なしの場合：他人の下書きは見せない
      where.OR = [{ status: "PUBLISHED" }, { userId: currentUserId || "GUEST" }];
    }

    // リスト取得制限 (isTemplate / deletedFlg)
    const setListFilter = (field: keyof Prisma.DungeonWhereInput, param: string) => {
      const list = searchParams.getAll(param);
      if (list.length > 0) {
        (where as any)[field] = { in: list.map((v) => v === "true") };
      }
    };
    setListFilter("isTemplate", "isTemplateList");
    setListFilter("deletedFlg", "deletedFlgList");

    // DB実行 (合計件数とデータ取得)
    const [totalCount, dungeonsRaw] = await Promise.all([
      prisma.dungeon.count({ where }),
      prisma.dungeon.findMany({
        where,
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
    let dungeons = dungeonsRaw.map((d) => ({
      ...d,
      totalPlayCount: d.clearPlayCount + d.failurePlayCount + d.interruptPlayCount,
      tags: d.dungeonTags.map((dt) => dt.tag),
      dungeonTags: undefined, // レスポンスを綺麗にするため削除
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

// POST: ダンジョン新規作成
export async function POST(request: Request) {
  try {
    const body: CreateDungeonRequest = await request.json();

    // 必須項目のバリデーション
    if (!body.name || !body.code || !body.userId || !body.mapData) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    const newDungeon = await prisma.dungeon.create({
      data: {
        // 基本情報
        name: body.name,
        code: body.code,
        userId: body.userId,
        description: body.description,

        // マップ・ゲーム設定
        mapData: body.mapData,
        mapSizeHeight: body.mapSizeHeight,
        mapSizeWidth: body.mapSizeWidth,
        timeLimit: body.timeLimit ?? 60,
        difficulty: body.difficulty ?? 1,
        status: body.status ?? "DRAFT",
        isTemplate: body.isTemplate ?? false,

        // メタデータ
        createdBy: body.createdBy,
        updatedBy: body.updatedBy,

        // タグ情報 (中間テーブル DungeonTag への同時書き込み)
        ...(body.tagIds &&
          body.tagIds.length > 0 && {
            dungeonTags: {
              create: body.tagIds.map((id) => ({
                tag: {
                  connect: { id }, // 既存のTag IDと紐付け
                },
              })),
            },
          }),
      },
    });

    return NextResponse.json(newDungeon, { status: 201 });
  } catch (error: any) {
    console.error("Dungeon Creation Error:", error);

    // Prismaのユニーク制約エラー（codeが重複した場合など）のハンドリング
    if (error.code === "P2002") {
      return NextResponse.json({ error: "このコードは既に使用されています" }, { status: 400 });
    }

    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
