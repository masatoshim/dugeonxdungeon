"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapData } from "@/game-core/types";
import { AlertTriangle, LogOut, Keyboard, Smartphone } from "lucide-react";
import { TileIconForm } from "../edit/palette/TileIconForm";
import { TILE_SIZE } from "@/game-core/types";

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

const DEADZONE = 8; // 反応するまでの最小移動距離（誤爆防止）

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
  const [gameCanvasHeight, setGameCanvasHeight] = useState<number>(300);

  const isResizingRef = useRef(false);
  const resizeStartYRef = useRef(0);
  const startHeightRef = useRef(300);
  const isGameFinishedRef = useRef(false);

  // ゲーム制御用
  const requestInterruptRef = useRef<(() => void) | null>(null);
  const requestZoomRef = useRef<((zoomIn: boolean) => void) | null>(null);
  const requestPauseRef = useRef<((pause: boolean) => void) | null>(null);

  // タッチ操作用
  const requestTouchMoveRef = useRef<((dir: { x: number; y: number }) => void) | null>(null);
  const requestTouchActionRef = useRef<(() => void) | null>(null);
  const requestTouchReleaseRef = useRef<(() => void) | null>(null);

  // フリータッチパッド用状態
  const [activeDir, setActiveDir] = useState<{ x: number; y: number } | null>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const isPadTouchingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const touchStartTimeRef = useRef(0);
  const touchStartCoordRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // レイアウト・高さ計算ロジック
  const calculateOptimalHeight = useCallback((isMobile: boolean) => {
    const windowH = window.innerHeight;
    if (isMobile) {
      return Math.min(Math.max(windowH - 240, 160), 380);
    } else {
      return Math.min(Math.max(windowH - 200, 280), 620);
    }
  }, []);

  // 画面サイズ・リサイズの監視
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobileScreen(mobile);

      if (!isResizingRef.current) {
        setGameCanvasHeight(calculateOptimalHeight(mobile));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateOptimalHeight]);

  // 離脱防止とブラウザバック制御
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGameFinishedRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = () => {
      if (isGameFinishedRef.current) return;
      window.history.pushState(null, "", window.location.href);
      setIsConfirmOpen(true);
      requestPauseRef.current?.(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // ゲーム終了ラッパー
  const handleClearWrapper = useCallback(
    (score: number, timeLeft: number) => {
      isGameFinishedRef.current = true;
      onClear(score, timeLeft);
    },
    [onClear],
  );

  const handleGameOverWrapper = useCallback(
    (score: number, timeLeft: number) => {
      isGameFinishedRef.current = true;
      onGameOver(score, timeLeft);
    },
    [onGameOver],
  );

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
    requestPauseRef.current?.(false);
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
    setGameCanvasHeight(Math.min(Math.max(startHeightRef.current + dy, 140), 500));
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!isResizingRef.current) return;
    isResizingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // フリータッチ・パッド操作ハンドラ
  const updateDirectionFromClientCoord = (clientX: number, clientY: number) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const startDx = clientX - touchStartCoordRef.current.x;
    const startDy = clientY - touchStartCoordRef.current.y;
    const startDistance = Math.sqrt(startDx * startDx + startDy * startDy);

    if (startDistance > DEADZONE) {
      hasMovedRef.current = true;
    }

    if (distance > DEADZONE) {
      // 角度を計算
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const absAngle = Math.abs(angle);

      let dirX = 0;
      let dirY = 0;

      // 上下左右の判定範囲を広く持たせる
      if (absAngle >= 155 || absAngle <= 25) {
        dirX = dx > 0 ? 1 : -1;
        dirY = 0;
      } else if (absAngle >= 65 && absAngle <= 115) {
        dirX = 0;
        dirY = dy > 0 ? 1 : -1;
      } else {
        // 斜め
        dirX = dx > 0 ? 1 : -1;
        dirY = dy > 0 ? 1 : -1;
      }

      setActiveDir({ x: dirX, y: dirY });
      requestTouchMoveRef.current?.({ x: dirX, y: dirY });
    } else {
      setActiveDir(null);
    }
  };

  const handlePadPointerDown = (e: React.PointerEvent) => {
    isPadTouchingRef.current = true;
    hasMovedRef.current = false;
    touchStartTimeRef.current = performance.now();
    touchStartCoordRef.current = { x: e.clientX, y: e.clientY };

    updateDirectionFromClientCoord(e.clientX, e.clientY);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePadPointerMove = (e: React.PointerEvent) => {
    if (!isPadTouchingRef.current) return;
    updateDirectionFromClientCoord(e.clientX, e.clientY);
  };

  const handlePadPointerUp = (e: React.PointerEvent) => {
    const duration = performance.now() - touchStartTimeRef.current;

    if (!hasMovedRef.current && duration < 350) {
      requestTouchActionRef.current?.();
    }

    isPadTouchingRef.current = false;
    hasMovedRef.current = false;
    setActiveDir(null);
    requestTouchReleaseRef.current?.();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // 円形パネルの外側をタップしたときの攻撃ハンドラ
  const handleOuterAreaClick = (e: React.MouseEvent) => {
    // 円形パッド本体がクリックされた場合はバブリングで二重発火しないように除外
    if (padRef.current && padRef.current.contains(e.target as Node)) {
      return;
    }
    requestTouchActionRef.current?.();
  };

  const activeTouchMode = forcedTouchMode !== null ? forcedTouchMode : isMobileScreen;

  return (
    <main className="flex flex-col items-center p-2 bg-stone-950 h-[100dvh] text-stone-100 select-none overflow-hidden justify-start gap-1">
      {/* ヘッダーエリア */}
      <div className="w-full max-w-3xl flex items-center justify-between gap-2 shrink-0 py-0.5">
        <h1 className="text-sm sm:text-lg font-bold font-mono text-amber-400 tracking-wide truncate min-w-0 flex-1">
          {dungeon.name}
        </h1>

        <button
          onClick={handleOpenConfirm}
          className="flex items-center gap-1 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-rose-400 border border-stone-700 px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer shadow-sm shrink-0"
        >
          <LogOut size={14} />
          <span>{isTestPlay ? "テストプレイを中断する" : "探索を中断する"}</span>
        </button>
      </div>

      {/* ゲームエリア */}
      <div className="w-full max-w-3xl flex flex-col relative shrink-0">
        <div
          style={{ height: `${gameCanvasHeight}px` }}
          className="relative w-full border border-stone-700/80 rounded-lg overflow-hidden shadow-2xl bg-black flex items-center justify-center transition-all duration-75"
        >
          {enabled ? (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-fill">
              <GameCanvas
                key={`${dungeon.id ?? "game"}-${dungeon.timeLimit ?? 0}-${JSON.stringify(parsedMapData)}`}
                mapData={parsedMapData}
                timeLimit={dungeon.timeLimit}
                onClear={handleClearWrapper}
                onGameOver={handleGameOverWrapper}
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

        {/* リサイズハンドル */}
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          className="w-full h-1.5 bg-stone-900/60 hover:bg-amber-500/30 border-x border-b border-stone-800 rounded-b-lg flex items-center justify-center cursor-ns-resize transition-colors group mt-[-1px] relative z-10"
          title="ドラッグしてゲーム画面の高さを変更"
        >
          <div className="w-6 h-0.5 bg-stone-600 group-hover:bg-amber-400 rounded-full" />
        </div>

        {/* 操作モード切り替え・ズームボタン */}
        <div className="flex justify-end items-center gap-1 mt-0.5 px-0.5">
          <button
            onClick={() => setForcedTouchMode(!activeTouchMode)}
            className="flex items-center gap-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 px-2 py-0 rounded transition-colors cursor-pointer shadow-sm h-5 text-[11px]"
            title="操作モード切り替え"
          >
            <Keyboard size={12} className={!activeTouchMode ? "text-amber-400" : "text-stone-600"} />
            <span className="w-[1px] h-2.5 bg-stone-800" />
            <Smartphone size={12} className={activeTouchMode ? "text-amber-400" : "text-stone-600"} />
          </button>
          <button
            onClick={() => requestZoomRef.current?.(false)}
            className="w-5 h-5 flex items-center justify-center bg-stone-900 hover:bg-stone-800 text-stone-300 rounded text-[11px] border border-stone-800 cursor-pointer"
            title="縮小"
          >
            ー
          </button>
          <button
            onClick={() => requestZoomRef.current?.(true)}
            className="w-5 h-5 flex items-center justify-center bg-stone-900 hover:bg-stone-800 text-stone-300 rounded text-[11px] border border-stone-800 cursor-pointer"
            title="拡大"
          >
            ＋
          </button>
        </div>
      </div>

      {/* PC操作ガイド */}
      {!activeTouchMode && (
        <div className="flex flex-col sm:flex-row p-2.5 sm:p-2 bg-stone-900/80 rounded-2xl w-full max-w-3xl border border-stone-800 backdrop-blur-sm items-center justify-between gap-2 mt-1 animate-in fade-in duration-150">
          {/* メッセージ部分 */}
          <div className="flex items-center flex-wrap justify-center sm:justify-start gap-1 text-xs text-amber-300/90 font-mono font-medium">
            <TileIconForm tileId="P" size={TILE_SIZE * 0.8} />
            <span>プレイヤーを</span>
            <TileIconForm tileId="G" size={TILE_SIZE * 0.8} />
            <span>ゴールに導いてクリアしよう！</span>
          </div>

          {/* 操作説明部分 */}
          <div className="text-xs text-stone-400 bg-stone-950 px-2.5 py-1 rounded-xl border border-stone-800/80 font-mono shrink-0">
            操作: 矢印キーで移動 / スペースで攻撃
          </div>
        </div>
      )}

      {/* タッチ操作エリア */}
      {activeTouchMode && (
        <div
          onClick={handleOuterAreaClick}
          className="flex flex-col w-full max-w-3xl bg-stone-900/95 rounded-lg border border-amber-500/40 backdrop-blur-md items-center justify-center touch-none shadow-xl p-2 text-center select-none flex-1 min-h-[160px] max-h-[240px] overflow-hidden mt-0.5 cursor-pointer relative"
        >
          <div className="absolute top-2 left-0 right-0 flex items-center justify-center gap-1.5 text-[11px] text-amber-300/90 font-mono pointer-events-none px-2 truncate">
            <TileIconForm tileId="P" size={TILE_SIZE * 0.5} />
            <span>⇒</span>
            <TileIconForm tileId="G" size={TILE_SIZE * 0.5} />
            <span className="text-stone-400 truncate">
              ｜ パッド外タップで<strong className="text-amber-400">攻撃</strong> / パッド内スライドで移動
            </span>
          </div>

          {/* 可変対応円形パッド */}
          <div
            ref={padRef}
            onPointerDown={handlePadPointerDown}
            onPointerMove={handlePadPointerMove}
            onPointerUp={handlePadPointerUp}
            className="relative w-[36vw] max-w-[150px] min-w-[110px] aspect-square bg-stone-950/80 rounded-full border-2 border-stone-800 flex items-center justify-center shadow-inner cursor-pointer touch-none m-auto"
          >
            <div className="absolute inset-2 rounded-full border border-amber-500/10 pointer-events-none" />

            <span className="absolute top-1 text-[10px] font-mono text-stone-500 pointer-events-none">▲</span>
            <span className="absolute bottom-1 text-[10px] font-mono text-stone-500 pointer-events-none">▼</span>
            <span className="absolute left-1.5 text-[10px] font-mono text-stone-500 pointer-events-none">◀</span>
            <span className="absolute right-1.5 text-[10px] font-mono text-stone-500 pointer-events-none">▶</span>

            {activeDir && (
              <div className="absolute inset-0 rounded-full bg-amber-500/15 border border-amber-400/40 pointer-events-none flex items-center justify-center">
                {/* <span className="text-xs font-mono font-bold text-amber-300">
                  {activeDir.x === 0 && activeDir.y === -1 && "上"}
                  {activeDir.x === 0 && activeDir.y === 1 && "下"}
                  {activeDir.x === -1 && activeDir.y === 0 && "左"}
                  {activeDir.x === 1 && activeDir.y === 0 && "右"}
                  {activeDir.x === -1 && activeDir.y === -1 && "左上"}
                  {activeDir.x === 1 && activeDir.y === -1 && "右上"}
                  {activeDir.x === -1 && activeDir.y === 1 && "左下"}
                  {activeDir.x === 1 && activeDir.y === 1 && "右下"}
                </span> */}
              </div>
            )}

            {!activeDir && (
              <div className="text-[10px] font-mono text-stone-400 pointer-events-none">スライドで移動</div>
            )}
          </div>
        </div>
      )}

      {/* 中断確認モーダル */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-700 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold font-mono text-stone-100 mb-2">
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
