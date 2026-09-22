"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapData } from "@/game-core/types";
import { AlertTriangle, LogOut, Hand, Keyboard, Smartphone } from "lucide-react";

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

  // 操作モードの手動上書き用ステート (null = 自動判定, true = タッチ/スマホ風, false = キーボード/PC風)
  const [forcedTouchMode, setForcedTouchMode] = useState<boolean | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // ゲーム画面の高さを動的に算出
  const calculateOptimalHeight = useCallback((isMobile: boolean) => {
    const windowH = window.innerHeight;
    if (isMobile) {
      // スマホ表示時
      const reserved = 240;
      const calculated = windowH - reserved;
      return Math.min(Math.max(calculated, 220), 380);
    } else {
      // PC表示時
      const estimatedReservedHeight = 210;
      const calculated = windowH - estimatedReservedHeight;
      return Math.min(Math.max(calculated, 300), 620);
    }
  }, []);

  const [gameCanvasHeight, setGameCanvasHeight] = useState<number>(400);
  const isResizingRef = useRef(false);
  const resizeStartYRef = useRef(0);
  const startHeightRef = useRef(400);

  const requestInterruptRef = useRef<(() => void) | null>(null);
  const requestZoomRef = useRef<((zoomIn: boolean) => void) | null>(null);
  const requestPauseRef = useRef<((pause: boolean) => void) | null>(null);

  // 画面外（親コンポーネント）でのフリック操作用
  const requestTouchMoveRef = useRef<((dir: { x: number; y: number }) => void) | null>(null);
  const requestTouchActionRef = useRef<(() => void) | null>(null);
  const requestTouchReleaseRef = useRef<(() => void) | null>(null);

  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const pointerDownTimeRef = useRef(0);
  const isSwipingRef = useRef(false);
  const SWIPE_THRESHOLD = 25;

  // 画面サイズ・リサイズの監視と動的高さの設定
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobileScreen(mobile);

      // ユーザーが手動でリサイズしていない場合のみ、スクロールが出ない高さを自動設定
      if (!isResizingRef.current) {
        setGameCanvasHeight(calculateOptimalHeight(mobile));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateOptimalHeight]);

  // 実際にタッチモードにするかどうかの判定
  const activeTouchMode = forcedTouchMode !== null ? forcedTouchMode : isMobileScreen;

  // 「中断して戻る」ボタン押下時
  const handleOpenConfirm = () => {
    setIsConfirmOpen(true);
    requestPauseRef.current?.(true);
  };

  // 「続ける」ボタン押下時
  const handleResume = () => {
    setIsConfirmOpen(false);
    requestPauseRef.current?.(false);
  };

  // 「中断する」ボタン押下時
  const handleAbortClick = () => {
    if (requestInterruptRef.current) {
      requestInterruptRef.current();
    } else {
      onInterrupt(0, 0);
    }
  };

  // ゲームエリアの下部ドラッグリサイズ
  const handleResizePointerDown = (e: React.PointerEvent) => {
    isResizingRef.current = true;
    resizeStartYRef.current = e.clientY;
    startHeightRef.current = gameCanvasHeight;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizingRef.current) return;
    const dy = e.clientY - resizeStartYRef.current;
    const newHeight = Math.min(Math.max(startHeightRef.current + dy, 200), 700);
    setGameCanvasHeight(newHeight);
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!isResizingRef.current) return;
    isResizingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // スワイプ/ドラッグ操作エリア
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.buttons !== 1 && e.button !== 0) return;

    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    pointerDownTimeRef.current = performance.now();
    isSwipingRef.current = false;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.buttons === 0) return;

    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > SWIPE_THRESHOLD) {
      isSwipingRef.current = true;
      let dirX = 0;
      let dirY = 0;

      if (Math.abs(dx) > SWIPE_THRESHOLD) dirX = dx > 0 ? 1 : -1;
      if (Math.abs(dy) > SWIPE_THRESHOLD) dirY = dy > 0 ? 1 : -1;

      requestTouchMoveRef.current?.({ x: dirX, y: dirY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const duration = performance.now() - pointerDownTimeRef.current;
    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 一定距離未満かつ短時間のタップなら攻撃トリガー
    if (distance < SWIPE_THRESHOLD && duration < 300 && !isSwipingRef.current) {
      requestTouchActionRef.current?.();
    }

    // 指を離したら移動停止
    requestTouchReleaseRef.current?.();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <main className="flex flex-col items-center p-2.5 sm:p-4 bg-stone-950 min-h-screen text-stone-100 select-none overflow-hidden">
      <div className="w-full max-w-3xl flex flex-col items-center shrink-0">
        {/* ヘッダーエリア */}
        <div className="w-full flex items-center justify-between mb-1.5 gap-4">
          <h1 className="text-lg sm:text-xl font-bold font-serif text-amber-400 tracking-wide truncate min-w-0 flex-1">
            {dungeon.name}
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenConfirm}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-rose-400 border border-stone-700 px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <LogOut size={14} />
              <span>中断して戻る</span>
            </button>
          </div>
        </div>

        {/* ゲームエリア */}
        <div className="w-full flex flex-col mb-1 relative">
          <div
            style={{ height: `${gameCanvasHeight}px` }}
            className="relative w-full border-2 border-stone-700/80 rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center transition-all duration-75"
          >
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
                  requestPauseRef={requestPauseRef}
                  requestTouchMoveRef={requestTouchMoveRef}
                  requestTouchActionRef={requestTouchActionRef}
                  requestTouchReleaseRef={requestTouchReleaseRef}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-950 text-stone-500 font-mono text-sm">
                準備中...
              </div>
            )}
          </div>

          {/* ゲームエリア下部のリサイズハンドル */}
          <div
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            className="w-full h-3 bg-stone-900/60 hover:bg-amber-500/30 border-x border-b border-stone-800 rounded-b-xl flex items-center justify-center cursor-ns-resize transition-colors group mt-[-2px] relative z-10"
            title="ドラッグしてゲーム画面の高さを変更"
          >
            <div className="w-10 h-1 bg-stone-600 group-hover:bg-amber-400 rounded-full" />
          </div>

          {/* 操作モード切り替えボタン ＆ 拡大縮小ボタンのコンテナ */}
          <div className="flex justify-end items-center gap-1.5 mt-1 px-1">
            {/* 操作モード手動切り替えボタン */}
            <button
              onClick={() => setForcedTouchMode(activeTouchMode ? false : true)}
              className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-sm h-7"
              title="操作モードを切り替え (PC / タッチ)"
            >
              {/* PC操作アイコン */}
              <Keyboard
                size={15}
                className={
                  !activeTouchMode ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" : "text-stone-600"
                }
              />
              <span className="w-[1px] h-3.5 bg-stone-800" />
              {/* スマホ操作アイコン */}
              <Smartphone
                size={15}
                className={
                  activeTouchMode ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" : "text-stone-600"
                }
              />
            </button>
            {/* 拡大縮小ボタン */}
            <button
              onClick={() => requestZoomRef.current?.(false)}
              className="w-7 h-7 flex items-center justify-center bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-lg text-xs border border-stone-800 shadow-sm transition-colors active:scale-95 cursor-pointer"
              title="縮小"
            >
              ー
            </button>
            <button
              onClick={() => requestZoomRef.current?.(true)}
              className="w-7 h-7 flex items-center justify-center bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-lg text-xs border border-stone-800 shadow-sm transition-colors active:scale-95 cursor-pointer"
              title="拡大"
            >
              ＋
            </button>
          </div>
        </div>
      </div>

      {/* PC表示モード時 */}
      {!activeTouchMode && (
        <div className="flex p-2 bg-stone-900/80 rounded-2xl w-full max-w-3xl border border-stone-800 backdrop-blur-sm items-center justify-between gap-2 mt-1 animate-in fade-in duration-150">
          <div className="text-xs text-amber-300/90 font-serif font-medium">
            プレイヤーをゴールに導いてクリアしよう！
          </div>
          <div className="text-xs text-stone-400 bg-stone-950 px-2.5 py-1 rounded-xl border border-stone-800/80 font-mono shrink-0">
            操作: 矢印キーで移動 / スペースで攻撃
          </div>
        </div>
      )}

      {/* タッチ操作モード時 */}
      {activeTouchMode && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex flex-1 w-full max-w-3xl bg-stone-900/95 rounded-2xl border-2 border-amber-500/50 backdrop-blur-md flex-col items-center justify-center gap-1.5 touch-none shadow-xl mt-1 p-3 text-center animate-in fade-in duration-150 cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-xs sm:text-sm">
            <Hand size={18} className="animate-pulse text-amber-400" />
            <span>ここをスワイプ（ドラッグ）して操作</span>
          </div>
          <div className="text-xs text-stone-400 bg-stone-950/80 py-1.5 px-3 rounded-xl border border-stone-800/80 font-mono">
            スワイプで移動 / タップ・クリックで攻撃
          </div>
        </div>
      )}

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
                onClick={handleResume}
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
