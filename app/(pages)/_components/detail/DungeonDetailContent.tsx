"use client";

import { DungeonInfoSection } from "./DungeonInfoSection";
import { DungeonRankingPanel } from "./DungeonRankingPanel";
import { RankingSkeleton } from "./RankingSkeleton";
import { useGetDungeon, useGetDungeonRankings } from "@/app/_hooks";
import { Loader2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DungeonDetailContent({ id }: { id: string }) {
  // ダンジョン基本情報の取得
  const { dungeon, error: dungeonError } = useGetDungeon(id);

  // ランキング情報の取得
  const { dungeonRankings: rankingData, isLoading: isRankingLoading } = useGetDungeonRankings(id);

  // エラー表示
  if (dungeonError) {
    return <div className="py-20 text-center text-red-400 font-bold">ダンジョンデータの取得に失敗しました。</div>;
  }

  // 基本情報すらまだない場合（リロード時など）
  if (!dungeon) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-slate-500">
        <Loader2 className="animate-spin" size={32} />
        <p className="font-mono text-sm tracking-widest uppercase">Initializing Dungeon...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {/* 上部：基本情報セクション */}
      <DungeonInfoSection dungeon={dungeon} isCleared={!!rankingData?.myRecord} />

      <hr className="border-slate-800" />

      {/* 下部：ランキングセクション */}
      <section>
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 italic uppercase tracking-wider">
          <span className="w-2 h-6 bg-cyan-400 block -skew-x-12" />
          Dungeon Rankings
        </h3>

        {isRankingLoading ? (
          // ランキング取得中はスケルトンを表示
          <RankingSkeleton />
        ) : (
          <DungeonRankingPanel rankings={rankingData?.rankings || []} myRecord={rankingData?.myRecord || null} />
        )}
      </section>
    </div>
  );
}
