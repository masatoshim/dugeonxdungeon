"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { MapData } from "@/game-core/types";
import { AlertTriangle, LogOut } from "lucide-react";

// Canvas操作を含むコンポーネントをロード
const GameCanvas = dynamic(() => import("@/app/(pages)/dungeons/_components/game/GameCanvas"), {
  ssr: false,
});

interface PlayGameContentProps {
  dungeon: {
    id?: string;
    name: string;
    difficulty: string | number;
    timeLimit: number;
    description?: string | null;
  };
  parsedMapData: MapData;
  onClear: (score: number, timeLeft: number) => void;
  onGameOver: (score: number, timeLeft: number) => void;
  onInterrupt: (score: number, timeLeft: number) => void;
  enabled?: boolean;
}

export function PlayGameContent({
  dungeon,
  parsedMapData,
  onClear,
  onGameOver,
  onInterrupt,
  enabled = true,
}: PlayGameContentProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const requestInterruptRef = useRef<(() => void) | null>(null);

  const handleAbortClick = () => {
    // Phaserへリクエスト要求
    if (requestInterruptRef.current) {
      requestInterruptRef.current();
    } else {
      // 万が一Phaserが準備できていない場合のフォールバック
      onInterrupt(0, 0);
    }
  };

  return (
    <main className="flex flex-col items-center p-6 sm:p-8 bg-stone-950 min-h-screen text-stone-100">
      {/* ヘッダーエリア */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-amber-400 tracking-wide">{dungeon.name}</h1>
        <button
          onClick={() => setIsConfirmOpen(true)}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-rose-400 border border-stone-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
        >
          <LogOut size={14} />
          <span>中断して戻る</span>
        </button>
      </div>

      {/* ゲームエリア */}
      <div className="relative border-2 border-stone-700/80 rounded-2xl overflow-hidden shadow-2xl bg-black">
        {enabled ? (
          <GameCanvas
            mapData={parsedMapData}
            timeLimit={dungeon.timeLimit}
            onClear={onClear}
            onGameOver={onGameOver}
            onInterrupt={onInterrupt}
            requestInterruptRef={requestInterruptRef}
          />
        ) : (
          <div className="w-[800px] h-[600px] flex items-center justify-center bg-stone-950 text-stone-500 font-mono">
            準備中...
          </div>
        )}
      </div>

      {/* ダンジョン情報セクション */}
      <div className="mt-6 p-4 sm:p-5 bg-stone-900/80 rounded-2xl w-full max-w-4xl border border-stone-800 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm sm:text-base font-semibold text-amber-400 font-serif">
            難易度: {"★".repeat(Number(dungeon.difficulty) || 1)}
          </span>
          <span className="text-sm sm:text-base font-semibold text-stone-300 font-mono">
            制限時間: {dungeon.timeLimit}s
          </span>
        </div>

        <p className="text-stone-400 text-xs sm:text-sm italic mb-4">
          {dungeon.description || "このダンジョンに説明はありません。"}
        </p>

        <div className="text-xs text-stone-400 bg-stone-950 p-3 rounded-xl border border-stone-800/80 flex items-center gap-2 font-mono">
          <span className="text-base">🎮</span>
          <span>操作方法: 矢印キーで移動 / スペースキーでアクション</span>
        </div>
      </div>

      {/* 中断確認モーダル */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-700 p-6 sm:p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold font-serif text-stone-100 mb-2">探索を中断しますか？</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                続ける
              </button>
              <button
                onClick={handleAbortClick}
                className="flex-1 bg-rose-700 hover:bg-rose-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-rose-700/20"
              >
                中断する
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
