"use client";

import { DungeonCard } from "@/app/(pages)/_components/DungeonCard";
import { DungeonResponse } from "@/types";

interface DungeonCardListProps {
  dungeons: DungeonResponse[] | undefined;
  isLoading: boolean;
  error: string;
}

export function DungeonCardList({ dungeons, isLoading, error }: DungeonCardListProps) {
  if (error)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-500">
        データの読み込みに失敗しました。
      </div>
    );

  return (
    <main className="max-w-7xl mx-auto">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <DungeonCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {dungeons?.map((dungeon) => (
            <DungeonCard key={dungeon.id} dungeon={dungeon} isCleared={dungeon.isCleared} />
          ))}
        </div>
      )}

      {!isLoading && dungeons?.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          <p className="text-slate-500 text-sm">ダンジョンがありません。</p>
        </div>
      )}
    </main>
  );
}

// 読み込み中のスケルトン表示
function DungeonCardSkeleton() {
  return (
    <div className="bg-[#1a233a] border border-slate-800 rounded-xl p-5 h-[280px] animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-20 h-4 bg-slate-700 rounded" />
        <div className="w-12 h-4 bg-slate-700 rounded" />
      </div>
      <div className="w-3/4 h-8 bg-slate-700 rounded mb-4" />
      <div className="w-1/2 h-4 bg-slate-700 rounded mb-8" />
      <div className="space-y-2">
        <div className="w-full h-3 bg-slate-800 rounded" />
        <div className="w-full h-3 bg-slate-800 rounded" />
      </div>
    </div>
  );
}
