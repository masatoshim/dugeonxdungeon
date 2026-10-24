"use client";

import { DungeonCard } from "@/app/(pages)/_components/list/DungeonCard";
import { DungeonResponse } from "@/app/_types";

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
    <div className="w-full">
      <div className={`w-full`}>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-full">
                <DungeonCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {dungeons?.map((dungeon) => (
              <div key={dungeon.id} className="w-full">
                <DungeonCard dungeon={dungeon} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && dungeons?.length === 0 && (
          <div className="w-full text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            <p className="text-slate-500 text-sm">ダンジョンがありません。</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 読み込み中のスケルトン表示
function DungeonCardSkeleton() {
  return (
    <div className="bg-[#1a233a] border border-slate-800 rounded-xl p-5 h-[280px] w-[280px] animate-pulse shrink-0">
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
