"use client";

import { useState, useRef } from "react";
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
  isTestPlay?: boolean;
}

export function PlayGameContent({
  dungeon,
  parsedMapData,
  onClear,
  onGameOver,
  onInterrupt,
  enabled = true,
  isTestPlay = false,
}: PlayGameContentProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const requestInterruptRef = useRef<(() => void) | null>(null);
  const requestZoomRef = useRef<((zoomIn: boolean) => void) | null>(null);

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
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-amber-400 tracking-wide truncate min-w-0 flex-1">
          {dungeon.name}
        </h1>
        <button
          onClick={() => setIsConfirmOpen(true)}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-rose-400 border border-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shrink-0"
        >
          <LogOut size={14} />
          <span>中断して戻る</span>
        </button>
      </div>

      {/* ゲームエリア */}
      <div className="w-full max-w-3xl flex flex-col mb-2">
        <div className="relative w-full h-[360px] sm:h-[480px] md:h-[520px] border-2 border-stone-700/80 rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center">
          {enabled ? (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-fill">
              <GameCanvas
                mapData={parsedMapData}
                timeLimit={dungeon.timeLimit}
                onClear={onClear}
                onGameOver={onGameOver}
                onInterrupt={onInterrupt}
                requestInterruptRef={requestInterruptRef}
                requestZoomRef={requestZoomRef}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-950 text-stone-500 font-mono text-sm">
              準備中...
            </div>
          )}
        </div>

        {/* 拡大縮小ボタン */}
        <div className="flex justify-end gap-1.5 mt-1.5 px-1">
          <button
            onClick={() => requestZoomRef.current?.(false)}
            className="w-8 h-8 flex items-center justify-center bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-lg text-sm border border-stone-800 shadow-sm transition-colors active:scale-95 cursor-pointer"
            title="縮小"
          >
            ー
          </button>
          <button
            onClick={() => requestZoomRef.current?.(true)}
            className="w-8 h-8 flex items-center justify-center bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-lg text-sm border border-stone-800 shadow-sm transition-colors active:scale-95 cursor-pointer"
            title="拡大"
          >
            ＋
          </button>
        </div>
      </div>

      {/* 説明 */}
      <div className="p-3 bg-stone-900/80 rounded-2xl w-full max-w-3xl border border-stone-800 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="text-xs sm:text-sm text-amber-300/90 font-serif font-medium text-center sm:text-left">
          プレイヤーをゴールに導いてクリアしよう！
        </div>

        <div className="text-xs text-stone-400 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800/80 flex items-center gap-2 font-mono shrink-0">
          <span>操作: 矢印キー移動 / スペースアクション</span>
        </div>
      </div>

      {/* 中断確認モーダル */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-700 p-6 sm:p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold font-serif text-stone-100 mb-2">
              {isTestPlay ? "テストプレイを中断しますか？" : "探索を中断しますか？"}
            </h3>
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
