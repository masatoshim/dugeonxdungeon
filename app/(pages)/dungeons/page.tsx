"use client";

import { Suspense } from "react";
import { DungeonCardList } from "@/app/(pages)/_components/list/DungeonCardList";
import { useGetDungeons } from "@/app/_hooks";
import { useSearchParams } from "next/navigation";
import { DungeonDetailModal } from "@/app/(pages)/_components/detail/DungeonDetailModal";
import { DungeonDetailContent } from "@/app/(pages)/_components/detail/DungeonDetailContent";

export default function DungeonsPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <DungeonsPageContent />
    </Suspense>
  );
}

function DungeonsPageContent() {
  const searchParams = useSearchParams();
  const dungeonId = searchParams.get("dungeonId");
  // 公開済みダンジョン一覧を取得
  const { dungeons, isLoading, error } = useGetDungeons({ status: "PUBLISHED" });

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <header className="max-w-7xl mx-auto mb-8 flex flex-wrap justify-between items-end gap-x-6 gap-y-3 border-l-4 border-[#4fd1d1] pl-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">EXPLORE DUNGEONS</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            世界中のプレイヤーが公開した多彩な迷宮を探索する
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 shrink-0">
          TOTAL : <span className="text-slate-200 font-bold">{dungeons?.length || 0}</span>
        </div>
      </header>

      {/* ダンジョン一覧 */}
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
