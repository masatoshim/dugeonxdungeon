"use client";

import { useState, Suspense } from "react";
import { DungeonCardList } from "@/app/(pages)/_components/list/DungeonCardList";
import { SortSelect, SortOptionItem } from "@/app/(pages)/_components/SortSelect";
import { usegetPlayHistoryByUser } from "@/app/_hooks";
import { useSearchParams } from "next/navigation";
import { DungeonDetailModal } from "@/app/(pages)/_components/detail/DungeonDetailModal";
import { DungeonDetailContent } from "@/app/(pages)/_components/detail/DungeonDetailContent";

// 履歴画面用のソート項目定義
const DUNGEON_SORT_OPTIONS: SortOptionItem[] = [
  { value: "lastPlayed", label: "最近遊んだ順" },
  { value: "createdAt", label: "最新（作成日）" },
  { value: "mapSize", label: "ダンジョンサイズ" },
  { value: "difficulty", label: "ダンジョン難しさ" },
  { value: "timeLimit", label: "制限時間" },
];

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="text-white font-mono animate-pulse">Loading...</div>}>
      <HistoryPageContent />
    </Suspense>
  );
}

function HistoryPageContent() {
  const searchParams = useSearchParams();
  const dungeonId = searchParams.get("dungeonId");
  const [sort, setSort] = useState<string>("favoritedAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const handleOrderToggle = (currentOrder: "asc" | "desc") => {
    setOrder(currentOrder);
  };

  // 最近遊んだダンジョンの一覧を取得
  const { dungeons, isLoading, error } = usegetPlayHistoryByUser({
    sort: sort,
    order: order,
  });

  return (
    <div className="w-full h-auto text-white">
      {/* ヘッダー */}
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-200">最近遊んだダンジョン</h1>
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
              placeholder="並び替え"
            />
          </div>

          {/* トータル数 */}
          <div className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
            Total: <span className="text-slate-400">{dungeons?.length || 0}</span> dungeons
          </div>
        </div>
      </header>

      {/* 履歴一覧 */}
      <div className="max-w-7xl mx-auto">
        <DungeonCardList dungeons={dungeons} isLoading={isLoading} error={error} />
      </div>

      {/* ダンジョン詳細モーダル表示 */}
      {dungeonId && (
        <DungeonDetailModal>
          <DungeonDetailContent id={dungeonId} />
        </DungeonDetailModal>
      )}
    </div>
  );
}
