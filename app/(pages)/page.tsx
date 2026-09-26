"use client";

import Image from "next/image";
import Link from "next/link";
import { DungeonSection } from "@/app/(pages)/_components/list/DungeonSection";
import { useGetDungeons } from "@/app/_hooks";
import { DungeonFilter } from "@/app/_types";

export default function Home() {
  const params: DungeonFilter = {
    limit: 4,
    sort: "favoritesCount",
    order: "desc",
  };

  const { dungeons, isLoading } = useGetDungeons(params);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-stone-100 font-sans antialiased selection:bg-amber-500 selection:text-stone-950 scroll-smooth">
      {/* メインビジュアル＆ボタンセクション */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-stone-100">
                <span className="text-teal-400">遊ぶ</span>×<span className="text-amber-400">創る</span>×
                <span className="text-orange-400">競う</span>
                <br />= DUNGEON×DUNGEON
              </h1>
              <p className="text-stone-400 text-sm md:text-base leading-relaxed">
                DUNGEON×DUNGEON — 手軽に遊べて、手軽に創れる。
                <br />
                手のひらサイズから巨大迷宮まで！
              </p>
            </div>

            {/* ページ内スクロールボタン */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="#play"
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
              >
                遊ぶ ▶
              </Link>
              <Link
                href="#create"
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
              >
                創る ▶
              </Link>
              <Link
                href="#compete"
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-stone-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
              >
                競う ▶
              </Link>
            </div>
          </div>

          <div className="w-full bg-[#121824] border border-stone-800 rounded-2xl overflow-hidden shadow-2xl p-3 flex items-center justify-center">
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-stone-900">
              <Image
                src="/images/top-visual.png"
                alt="DUNGEON×DUNGEON メインビジュアル"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </main>

      <div className="border-t border-stone-800/80 my-12"></div>

      {/* 各セクション */}
      <section id="play" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
        <div className="bg-[#121824] border border-stone-800/80 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4 font-mono">■ 遊ぶ (PLAY)</h2>
          <p className="text-stone-300 leading-relaxed">
            多彩なギミックや武器を駆使して、数々のダンジョンを踏破しよう！
          </p>
        </div>
      </section>

      <section id="create" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
        <div className="bg-[#121824] border border-stone-800/80 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-amber-400 mb-4 font-mono">■ 創る (CREATE)</h2>
          <p className="text-stone-300 leading-relaxed">
            最小4x4から最大99x99まで、あなただけのオリジナルダンジョンを直感的に設計・公開できます。
          </p>
        </div>
      </section>

      <section id="compete" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
        <div className="bg-[#121824] border border-stone-800/80 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-orange-400 mb-4 font-mono">■ 競う (COMPETE)</h2>
          <p className="text-stone-300 leading-relaxed">
            クリアタイムやスコアを他のプレイヤーと競い合い、ランキング上位を目指しましょう！
          </p>
        </div>
      </section>

      <div className="border-t border-stone-800/80 my-12"></div>

      {/* おすすめダンジョンセクション */}
      <div id="recommend" className="max-w-6xl mx-auto px-6 py-12 scroll-mt-20">
        <DungeonSection title="おすすめダンジョン" viewMoreLink="/dungeons" dungeons={dungeons} isLoading={isLoading} />
      </div>

      <footer className="w-full py-8 text-center text-xs text-stone-500 border-t border-stone-800/80 mt-16 font-mono">
        © 2026 DUNGEON×DUNGEON
      </footer>
    </div>
  );
}
