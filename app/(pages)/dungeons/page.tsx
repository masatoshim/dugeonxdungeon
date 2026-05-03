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
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            EXPLORE DUNGEONS
          </h1>
          <p className="text-slate-400 mt-2">世界中のクリエイターが作成したダンジョンに挑もう</p>
        </div>
        <div className="text-sm text-slate-500 font-mono">TOTAL: {dungeons?.length || 0} DUNGEONS</div>
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
