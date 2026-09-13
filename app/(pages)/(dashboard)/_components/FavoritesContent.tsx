"use client";

import { useState } from "react";
import { DungeonCardList } from "@/app/(pages)/_components/list/DungeonCardList";
import { SortSelect, SortOptionItem } from "@/app/(pages)/_components/SortSelect";
import { useGetFavoriteDungeons } from "@/app/_hooks";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DungeonDetailModal } from "@/app/(pages)/_components/detail/DungeonDetailModal";
import { DungeonDetailContent } from "@/app/(pages)/_components/detail/DungeonDetailContent";
import { UserResponse } from "@/app/_types";
import { Pagination } from "@/app/(pages)/_components/Pagination";

// お気に入り画面用のソート項目定義
const DUNGEON_SORT_OPTIONS: SortOptionItem[] = [
  { value: "favoritedAt", label: "追加した順" },
  { value: "createdAt", label: "最新（作成日）" },
  { value: "mapSize", label: "ダンジョンサイズ" },
  { value: "difficulty", label: "ダンジョン難しさ" },
  { value: "timeLimit", label: "制限時間" },
];

interface FavoritesContentProps {
  user?: UserResponse;
}

export function FavoritesContent({ user }: FavoritesContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const userId = user && user.id;
  const dungeonId = searchParams.get("dungeonId");
  const page = Number(searchParams.get("page")) || 1;
  const limit = 20;
  const index = (page - 1) * limit;
  const [sort, setSort] = useState<string>("favoritedAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const handleOrderToggle = (currentOrder: "asc" | "desc") => {
    setOrder(currentOrder);
  };

  // お気に入りダンジョン一覧を取得
  const { dungeons, totalCount, isLoading, error } = useGetFavoriteDungeons({
    ...(userId && { userId }),
    limit,
    index,
    sort: sort,
    order: order,
  });

  const totalPages = Math.ceil((totalCount || 0) / limit);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  return (
    <div className="w-full h-auto text-white">
      {/* ヘッダー */}
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-200">
            {user && `${user.nickName}さん の`}
            お気に入りダンジョン
          </h1>
        </div>

        {/* ソート */}
        <div className="flex flex-col items-end gap-2">
          <div className="hidden md:block">
            <SortSelect
              sort={sort}
              order={order}
              options={DUNGEON_SORT_OPTIONS}
              onSelect={(val) => setSort(val)}
              onOrderToggle={handleOrderToggle}
            />
          </div>

          {/* トータル数 */}
          <div className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
            Total: <span className="text-slate-400">{totalCount || 0}</span> dungeons
          </div>
        </div>
      </header>

      {/* お気に入り一覧 */}
      <div className="max-w-7xl mx-auto">
        <DungeonCardList dungeons={dungeons} isLoading={isLoading} error={error} />
      </div>

      {/* ページネーション */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />

      {/* ダンジョン詳細モーダル表示 */}
      {dungeonId && (
        <DungeonDetailModal>
          <DungeonDetailContent id={dungeonId} />
        </DungeonDetailModal>
      )}
    </div>
  );
}
