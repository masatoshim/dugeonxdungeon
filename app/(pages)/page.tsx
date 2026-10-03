"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DungeonSection } from "@/app/(pages)/_components/list/DungeonSection";
import { useGetDungeons } from "@/app/_hooks";
import { DungeonFilter } from "@/app/_types";
import { useRouter } from "next/navigation";
import { LoginAlertModal } from "./_components/LoginAlertModal";
import { useDungeonAuth } from "@/app/_hooks/useDungeonAuth";

export default function Home() {
  const router = useRouter();

  // ポップアップの開閉管理
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const { handleCreateClick } = useDungeonAuth(() => {
    setShowLoginAlert(true);
  });

  const params: DungeonFilter = {
    limit: 4,
    status: "PUBLISHED",
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
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-stone-100 leading-tight">
                <span className="text-teal-400">遊ぶ</span> × <span className="text-amber-400">創る</span> ×{" "}
                <span className="text-orange-400">競う</span>
                <br />
                <span className="text-xl md:text-2xl font-mono tracking-wider text-stone-300 mt-2 block">
                  = DUNGEON × DUNGEON
                </span>
              </h1>
              <p className="text-stone-400 text-sm md:text-base leading-relaxed">
                DUNGEON×DUNGEON — 手軽に遊べて、手軽に創れる。
                <br />
                手のひらサイズから巨大迷宮まで！
              </p>
            </div>

            {/* ページ内スクロールボタン（ブラッシュアップ版） */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="#play"
                className="group relative flex items-center gap-2 bg-teal-500/10 border border-teal-500/50 hover:bg-teal-500 text-teal-300 hover:text-stone-950 font-bold px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(45,212,191,0.15)] hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all duration-300 active:scale-95"
              >
                <span>遊ぶ</span>
                <span className="transform group-hover:translate-x-1 transition-transform">▶</span>
              </Link>
              <Link
                href="#create"
                className="group relative flex items-center gap-2 bg-amber-500/10 border border-amber-500/50 hover:bg-amber-400 text-amber-300 hover:text-stone-950 font-bold px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.15)] hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all duration-300 active:scale-95"
              >
                <span>創る</span>
                <span className="transform group-hover:translate-x-1 transition-transform">▶</span>
              </Link>
              <Link
                href="#compete"
                className="group relative flex items-center gap-2 bg-orange-500/10 border border-orange-500/50 hover:bg-orange-500 text-orange-300 hover:text-stone-950 font-bold px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all duration-300 active:scale-95"
              >
                <span>競う</span>
                <span className="transform group-hover:translate-x-1 transition-transform">▶</span>
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

      {/* 遊ぶ */}
      <section id="play" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
        <div className="bg-gradient-to-br from-[#121824] to-[#0f172a] border border-teal-500/30 rounded-2xl p-8 md:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-teal-400 text-xs font-mono w-fit">
                FEATURE 01
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-teal-400 font-mono">■ 遊ぶ</h2>
              <p className="text-stone-300 leading-relaxed text-sm md:text-base">
                多彩なギミックやスリリングなトラップが待ち受ける無数のダンジョンへ挑もう。
                お気に入りのプレイスタイルを見つけて、数々の迷宮を踏破する快感を味わえます。
              </p>
              <ul className="space-y-2 text-stone-400 text-xs md:text-sm">
                <li className="flex items-center gap-2">✓ 難易度やサイズが異なる多彩なダンジョン</li>
                <li className="flex items-center gap-2">✓ 直感的な操作でサクサク遊べるブラウザゲーム体験</li>
                <li className="flex items-center gap-2">✓ お気に入り登録機能でお気に入りのステージをすぐプレイ</li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/dungeons")}
                  className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs md:text-sm py-3 px-6 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer"
                >
                  <span>ダンジョンを遊ぶ</span>
                </button>
              </div>
            </div>
            {/* 特徴イメージ・プレースホルダー */}
            <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-teal-500/30 shadow-lg group">
              <Image
                src="/images/game-play3.png"
                alt="DUNGEON×DUNGEON プレイ画面"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 創る */}
      <section id="create" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
        <div className="bg-gradient-to-br from-[#121824] to-[#0f172a] border border-amber-500/30 rounded-2xl p-8 md:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1 relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-amber-500/30 shadow-lg group">
              <Image
                src="/images/game-edit.png"
                alt="DUNGEON×DUNGEON 編集画面"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="order-1 md:order-2 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-mono w-fit">
                FEATURE 02
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-amber-400 font-mono">■ 創る</h2>
              <p className="text-stone-300 leading-relaxed text-sm md:text-base">
                あなたのアイデアを形にするダンジョンエディター。
                最小4×4から最大99×99まで、自由自在にレイアウトや配置をカスタマイズして世界中に公開できます。
              </p>
              <ul className="space-y-2 text-stone-400 text-xs md:text-sm">
                <li className="flex items-center gap-2">✓ グリッドサイズを自由に選択・拡張可能</li>
                <li className="flex items-center gap-2">✓ 壁や床、ギミックを配置するだけの簡単設計</li>
                <li className="flex items-center gap-2">✓ 公開・非公開のステータス管理に対応</li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreateClick}
                  className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs md:text-sm py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                >
                  <span>ダンジョンを創る</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 競う */}
      <section id="compete" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20">
        <div className="bg-gradient-to-br from-[#121824] to-[#0f172a] border border-orange-500/30 rounded-2xl p-8 md:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-400 text-xs font-mono w-fit">
                FEATURE 03
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-orange-400 font-mono">■ 競う</h2>
              <p className="text-stone-300 leading-relaxed text-sm md:text-base">
                クリアタイムやハイスコアを他のプレイヤーと競い合おう。
                自分が創ったダンジョンに挑戦してくれたプレイヤーの記録を見て、ランキング上位を目指せ！
              </p>
              <ul className="space-y-2 text-stone-400 text-xs md:text-sm">
                <li className="flex items-center gap-2">✓ リアルタイムなクリアタイム・スコア計測</li>
                <li className="flex items-center gap-2">✓ ライバルと競い合うランキングシステム</li>
                <li className="flex items-center gap-2">✓ 自作ステージのプレイ状況をチェック</li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/ranking")}
                  className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs md:text-sm py-3 px-6 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
                >
                  <span>ランキングを見る</span>
                </button>
              </div>
            </div>
            {/* 特徴イメージ・プレースホルダー */}
            <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-orange-500/30 shadow-lg group">
              <Image
                src="/images/game-ranking.png"
                alt="DUNGEON×DUNGEON スコア画面"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
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

      {/* 未ログインユーザー用のポップアップ */}
      <LoginAlertModal isOpen={showLoginAlert} onClose={() => setShowLoginAlert(false)} />
    </div>
  );
}
