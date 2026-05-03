"use client";

import { useState } from "react";
import { DungeonCardList } from "@/app/(pages)/_components/DungeonCardList";
import { SortDropdown, SortOption, SortOrder } from "@/app/(pages)/_components/SortDropdown";
import { useGetFavoriteDungeonByUser } from "@/app/_hooks";

export default function FavoritesPage() {
  const [sort, setSort] = useState<SortOption>("favoritedAt");
  const [order, setOrder] = useState<SortOrder>("desc");

  const toggleOrder = () => {
    setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // お気に入りダンジョン一覧を取得
  const { dungeons, isLoading, error } = useGetFavoriteDungeonByUser({
    sort: sort,
    order: order,
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-200">お気に入りダンジョン</h1>
        </div>
        {/* ソート */}
        <div className="flex flex-col items-end gap-2">
          <div className="hidden md:block">
            <SortDropdown
              currentSort={sort}
              onSortChange={setSort}
              currentOrder={order}
              onOrderToggle={toggleOrder}
              showFavoritedAt={true}
            />
          </div>

          {/* トータル数 */}
          <div className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
            Total: <span className="text-slate-400">{dungeons?.length || 0}</span> dungeons
          </div>
        </div>
      </header>

      <DungeonCardList dungeons={dungeons} isLoading={isLoading} error={error} />
    </div>
  );
}
