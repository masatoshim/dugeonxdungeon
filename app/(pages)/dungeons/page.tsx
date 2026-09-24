"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { DungeonCardList } from "@/app/(pages)/_components/list/DungeonCardList";
import { Pagination } from "@/app/(pages)/_components/Pagination";
import { SortSelect, SortOptionItem } from "@/app/(pages)/_components/SortSelect";
import { DungeonSearchFilterModal, DungeonFilterValues } from "@/app/(pages)/_components/DungeonSearchFilterModal";
import { useGetDungeons } from "@/app/_hooks";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DungeonDetailModal } from "@/app/(pages)/_components/detail/DungeonDetailModal";
import { DungeonDetailContent } from "@/app/(pages)/_components/detail/DungeonDetailContent";
import { useSWRConfig } from "swr";

const STORAGE_KEY = "dungeon_search_params_cache";

// 一覧画面用のソート項目定義
const DUNGEON_SORT_OPTIONS: SortOptionItem[] = [
  { value: "createdAt", label: "最新（作成日）" },
  { value: "mapSize", label: "ダンジョンサイズ" },
  { value: "difficulty", label: "ダンジョン難しさ" },
  { value: "timeLimit", label: "制限時間" },
];

export default function DungeonsPage() {
  return (
    <Suspense fallback={<div className="text-white p-8">読み込み中...</div>}>
      <DungeonsPageContent />
    </Suspense>
  );
}

function DungeonsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mutate: dmutate } = useSWRConfig();

  // 検索条件をsessionStorageに保持・復元するロジック
  useEffect(() => {
    const dungeonIdParam = searchParams.get("dungeonId");

    // 詳細画面（モーダル）を開いている最中はキャッシュを更新
    if (dungeonIdParam) {
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.delete("dungeonId");
      const searchString = currentParams.toString();
      if (searchString) {
        sessionStorage.setItem(STORAGE_KEY, searchString);
      }
      return;
    }

    const currentParams = new URLSearchParams(searchParams.toString());
    const searchString = currentParams.toString();

    if (searchString) {
      // 検索条件やページ指定がある場合はキャッシュに保存
      sessionStorage.setItem(STORAGE_KEY, searchString);
    } else {
      // URLにパラメータが何もない状態で一覧にアクセスされた場合
      // 「ゲームプレイ等の画面から戻ってきたフラグ」があるか確認する
      const keepSearch = sessionStorage.getItem("keep_dungeon_search");

      if (keepSearch === "true") {
        // 保持して戻ってきた場合のみ、フラグを消してキャッシュを復元する
        sessionStorage.removeItem("keep_dungeon_search");
        const savedParams = sessionStorage.getItem(STORAGE_KEY);
        if (savedParams) {
          router.replace(`${pathname}?${savedParams}`);
        }
      } else {
        // 別メニューからの遷移、または直アクセスの場合はキャッシュを完全に破棄してリセット状態にする
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [searchParams, pathname, router]);

  const dungeonId = searchParams.get("dungeonId");
  const page = Number(searchParams.get("page")) || 1;
  const [targetPage, setTargetPage] = useState(page);
  const limit = 20;
  const index = (page - 1) * limit;

  const sort = searchParams.get("sort") || "createdAt";
  const order = (searchParams.get("order") === "asc" ? "asc" : "desc") as "asc" | "desc";

  const getParam = (key: string) => {
    const val = searchParams.get(key);
    if (!val || val === "undefined" || val === "") return undefined;
    return val;
  };

  // 検索コンポーネントに渡す初期値の復元
  const initialFilterValues: DungeonFilterValues = {
    text: getParam("text") || "",
    difficultyList: getParam("difficultyList") ? getParam("difficultyList")!.split(",").map(Number) : [],
    mapSizeWidthFrom: getParam("mapSizeWidthFrom") || "",
    mapSizeWidthTo: getParam("mapSizeWidthTo") || "",
    mapSizeHeightFrom: getParam("mapSizeHeightFrom") || "",
    mapSizeHeightTo: getParam("mapSizeHeightTo") || "",
    timeLimitFrom: getParam("timeLimitFrom") || "",
    timeLimitTo: getParam("timeLimitTo") || "",
    playStatusList: getParam("playStatusList") ? getParam("playStatusList")!.split(",") : [],
    isFavoritesList: getParam("isFavoritesList") ? getParam("isFavoritesList")!.split(",") : [],
  };

  const handleSortChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", val);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  const handleOrderToggle = (currentOrder: "asc" | "desc") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("order", currentOrder);
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  // 検索コンポーネントからクエリ文字列を受け取ってURLに反映
  const handleSearch = (queryString: string) => {
    // 既存パラメータを引き継ぎ
    const params = new URLSearchParams(queryString);
    params.set("sort", sort);
    params.set("order", order);

    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  // ページネーション
  const handlePageChange = (newPage: number) => {
    setTargetPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  // 前回dungeonIdが存在していたかどうか
  const prevDungeonIdRef = useRef(dungeonId);

  // モーダルが開いていた状態から閉じた状態に変わった瞬間を検知
  useEffect(() => {
    if (prevDungeonIdRef.current && !dungeonId) {
      dmutate((key) => Array.isArray(key) && key[0] === "/api/dungeons", undefined, { revalidate: true });
    }
    prevDungeonIdRef.current = dungeonId;
  }, [dungeonId, dmutate]);

  const { dungeons, totalCount, isLoading, error } = useGetDungeons({
    status: "PUBLISHED",
    sort,
    order,
    limit,
    index,
    ...(getParam("text") && { text: getParam("text") }),
    ...(getParam("difficultyList") && { difficultyList: getParam("difficultyList") }),
    ...(getParam("mapSizeWidthFrom") && { mapSizeWidthFrom: Number(getParam("mapSizeWidthFrom")) }),
    ...(getParam("mapSizeWidthTo") && { mapSizeWidthTo: Number(getParam("mapSizeWidthTo")) }),
    ...(getParam("mapSizeHeightFrom") && { mapSizeHeightFrom: Number(getParam("mapSizeHeightFrom")) }),
    ...(getParam("mapSizeHeightTo") && { mapSizeHeightTo: Number(getParam("mapSizeHeightTo")) }),
    ...(getParam("timeLimitFrom") && { timeLimitFrom: Number(getParam("timeLimitFrom")) }),
    ...(getParam("timeLimitTo") && { timeLimitTo: Number(getParam("timeLimitTo")) }),
    ...(getParam("playStatusList") && { playStatusList: getParam("playStatusList")?.split(",") as any }),
    ...(getParam("isFavoritesList") && { isFavoritesList: getParam("isFavoritesList") }),
  });

  const totalPages = Math.ceil((totalCount || 0) / limit);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 sm:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-start gap-4 border-l-4 border-[#4fd1d1] pl-4">
        {/* タイトル領域 */}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">EXPLORE DUNGEONS</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            世界中のクリエイターが作成したダンジョンに挑もう！
          </p>
        </div>

        {/* 右側の検索・ソートボタン群など */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <DungeonSearchFilterModal initialValues={initialFilterValues} onSearch={handleSearch} />
            <div>
              <SortSelect
                sort={sort}
                order={order}
                options={DUNGEON_SORT_OPTIONS}
                onSelect={handleSortChange}
                onOrderToggle={handleOrderToggle}
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
            Total: <span className="text-slate-400">{totalCount || 0}</span> dungeons
          </div>
        </div>
      </header>

      {/* ダンジョン一覧 */}
      <DungeonCardList dungeons={dungeons} isLoading={isLoading} error={error} />

      {/* ページネーション */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />

      {/* ダンジョン詳細モーダル表示 */}
      {dungeonId && (
        <DungeonDetailModal>
          <DungeonDetailContent id={dungeonId} targetPage={targetPage} />
        </DungeonDetailModal>
      )}
    </div>
  );
}
