"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { DungeonCard } from "@/app/(pages)/_components/DungeonCard";
import { useGetDungeons } from "@/app/_hooks";
import { toast } from "sonner";

export default function DungeonsPage() {
  const { data: session } = useSession();

  // 公開済みダンジョン一覧を取得
  const { dungeons, isLoading, error } = useGetDungeons({ status: "PUBLISHED" });

  const handleFavoriteToggle = (dungeonId: string) => {
    if (!session) {
      toast.error("お気に入り登録にはログインが必要です", {
        action: {
          label: "ログイン",
          onClick: () => (window.location.href = "/login"),
        },
      });
      return;
    }
    // ここにAPIを叩く処理を実装
    console.log(`Favorite toggled for: ${dungeonId}`);
  };

  if (error)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-500">
        データの読み込みに失敗しました。
      </div>
    );

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

      <main className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <DungeonCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {dungeons?.map((dungeon) => (
              <DungeonCard
                key={dungeon.id}
                dungeon={dungeon}
                isCleared={dungeon.isCleared}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}

        {!isLoading && dungeons?.length === 0 && (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-700">
            <p className="text-slate-500 text-lg">公開されているダンジョンがまだありません。</p>
          </div>
        )}
      </main>
    </div>
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
