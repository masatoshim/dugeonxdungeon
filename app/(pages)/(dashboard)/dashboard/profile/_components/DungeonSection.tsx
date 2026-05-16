import Link from "next/link";
import { DungeonCard } from "@/app/(pages)/_components/list/DungeonCard";

interface DungeonSectionProps {
  title: string;
  viewMoreLink: string;
  dungeons: any[] | undefined; // 読み込み中は undefined
  isLoading: boolean;
}

export const DungeonSection = ({ title, viewMoreLink, dungeons, isLoading }: DungeonSectionProps) => {
  return (
    <section className="bg-slate-950/50 border border-slate-800/60 rounded-3xl p-8 shadow-2xl">
      {/* セクションヘッダー */}
      <div className="flex justify-between items-end mb-6 border-l-4 border-[#4fd1d1] pl-4">
        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
        <Link href={viewMoreLink} className="text-xs text-slate-500 hover:text-[#4fd1d1] transition-colors font-mono">
          詳細をみる &gt;&gt;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // ローディング中のスケルトン表示（4件分）
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 h-[220px] animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-3 bg-slate-800 rounded w-1/3" />
                <div className="h-5 bg-slate-800 rounded w-2/3" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-slate-800 rounded w-full" />
                  <div className="h-3 bg-slate-800 rounded w-5/6" />
                </div>
              </div>
              <div className="h-4 bg-slate-800 rounded w-1/4 self-end" />
            </div>
          ))
        ) : dungeons && dungeons.length > 0 ? (
          // データがある場合の通常表示
          dungeons.slice(0, 4).map((dungeon) => <DungeonCard key={dungeon.id} dungeon={dungeon} />)
        ) : (
          // データが0件の場合
          <div className="col-span-full py-10 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center">
            <p className="text-slate-600 text-sm font-mono uppercase tracking-widest">ダンジョンがありません</p>
          </div>
        )}
      </div>
    </section>
  );
};
