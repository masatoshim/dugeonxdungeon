"use client";

import { useState, Suspense } from "react";
import { DungeonCardList } from "@/app/(pages)/_components/list/DungeonCardList";
import { SortDropdown, SortOption, SortOrder } from "@/app/(pages)/_components/SortDropdown";
import { usegetPlayHistoryByUser } from "@/app/_hooks";
import { useSearchParams } from "next/navigation";
import { DungeonDetailModal } from "@/app/(pages)/_components/detail/DungeonDetailModal";
import { DungeonDetailContent } from "@/app/(pages)/_components/detail/DungeonDetailContent";

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <HistoryPageContent />
    </Suspense>
  );
}

function HistoryPageContent() {
  const searchParams = useSearchParams();
  const dungeonId = searchParams.get("dungeonId");
  const [sort, setSort] = useState<SortOption>("lastPlayed");
  const [order, setOrder] = useState<SortOrder>("desc");

  const toggleOrder = () => {
    setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // 最近遊んだダンジョンの一覧を取得
  const { dungeons, isLoading, error } = usegetPlayHistoryByUser({
    sort: sort,
    order: order,
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-200">最近遊んだダンジョン</h1>
        </div>
        {/* ソート */}
        <div className="flex flex-col items-end gap-2">
          <div className="hidden md:block">
            <SortDropdown
              currentSort={sort}
              onSortChange={setSort}
              currentOrder={order}
              onOrderToggle={toggleOrder}
              showLastPlayed={true}
            />
          </div>

          {/* トータル数 */}
          <div className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
            Total: <span className="text-slate-400">{dungeons?.length || 0}</span> dungeons
          </div>
        </div>
      </header>

      {/* 履歴一覧 */}
      <DungeonCardList dungeons={dungeons} isLoading={isLoading} error={error} />

      {/* ダンジョン詳細モーダル表示 */}
      {dungeonId && (
        <DungeonDetailModal>
          <DungeonDetailContent id={dungeonId} />
        </DungeonDetailModal>
      )}
    </div>
  );
}
