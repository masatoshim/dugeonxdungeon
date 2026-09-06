"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eraser, Info, X, Trash2 } from "lucide-react";

import { DUNGEON_DEFAULT, TILE_CATEGORIES } from "@/game-core/types";
import { TILE_CONFIG, TileConfigKey } from "@/game-core/master";
import { EditorInfoHeader, TileIconForm, TilePalette } from "@/app/(pages)/dungeons/_components";
import { useGetUser } from "@/app/_hooks";
import { useTileImages, useDungeonEditorLogic, useEditorHistory } from "@/app/(pages)/dungeons/_hook";
import { DungeonCanvasView } from "./DungeonCanvasView";
import { DungeonMetadataCard } from "./DungeonMetadataCard";
import { DungeonResponse } from "@/app/_types";

// Zodによるバリデーションスキーマ
const dungeonSchema = z.object({
  code: z.string(),
  name: z.string().min(1, "ダンジョン名は必須入力です").max(50, "ダンジョン名は50文字以内で入力してください"),
  description: z.string().max(500, "説明文は500文字以内で入力してください"),
  timeLimit: z
    .number()
    .min(1, "制限時間は1秒以上に設定してください")
    .max(3600, "制限時間は1時間以内に設定してください"),
  mapDataCheck: z.any(), // 変更検知用の隠しフィールド（バリデーションは通すだけ）
});
export type DungeonFormData = z.infer<typeof dungeonSchema>;

// ガイドメッセージ用の定義辞書
const LINKING_GUIDE_MESSAGES: Record<string, string> = {
  KEY: "「鍵」を配置して、扉とペアリングさせてください",
  KEY_DOOR: "「扉」を配置して、鍵とペアリングさせてください",
  BUTTON: "「ボタン」を配置して、扉とペアリングさせてください",
  BUTTON_DOOR: "「扉」を配置して、ボタンとペアリングさせてください",
  LEVER_SWITCH: "「レバースイッチ」を配置して、扉とペアリングさせてください",
  LEVER_SWITCH_DOOR: "「扉」を配置して、レバースイッチとペアリングさせてください",
  WARP_IN: "「ワープ入口」を配置して、ワープ出口とペアリングさせてください",
  WARP_OUT: "「ワープ出口」を配置して、ワープ入口とペアリングさせてください",
  WARP_TWO_WAY1: "「ワープ2」を配置して、ワープ1とペアリングさせてください",
  WARP_TWO_WAY2: "「ワープ1」を配置して、ワープ2とペアリングさせてください",
};

const ENTITY_TYPE_TO_TILE: Record<string, TileConfigKey> = {
  KEY: "GK",
  KEY_DOOR: "GKD",
  BUTTON: "GB",
  BUTTON_DOOR: "GBD",
  LEVER_SWITCH: "GLS",
  LEVER_SWITCH_DOOR: "GLSD",
  WARP_IN: "GWI",
  WARP_OUT: "GWO",
  WARP_TWO_WAY1: "GWT1",
  WARP_TWO_WAY2: "GWT2",
};

interface DungeonEditorProps {
  initialData?: DungeonResponse; // 編集時は既存データが入る
  isAdmin: boolean;
}

export function DungeonEditor({ initialData, isAdmin }: DungeonEditorProps) {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return toast.error("セッションが切断されました。再ログインしてください。");

  const { user: userInfo } = useGetUser(user.id);
  const searchParams = useSearchParams();

  // 管理者ダッシュボードのユーザーダンジョン「詳細ボタン」から遷移してきた場合
  // パレットパネルは閉じて、メタ情報パネルは開く
  const fromSource = searchParams.get("from");
  const isFromUserDetail = fromSource === "user-detail";

  const [isMetadataOpen, setIsMetadataOpen] = useState(isFromUserDetail);

  const mainRef = useRef<HTMLElement | null>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startScrollRef = useRef({ left: 0, top: 0 });

  const isEditMode = !!initialData?.id;
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(!isEditMode);
  // 選択中のタイルがアクティブなパレット内に存在するかの状態を持たせる
  const [isTileInActivePalette, setIsTileInActivePalette] = useState<boolean>(false);

  // React Hook Form の初期化
  const methods = useForm<DungeonFormData>({
    resolver: zodResolver(dungeonSchema),
    defaultValues: {
      code: initialData?.code || "-",
      name: initialData?.name || "",
      description: initialData?.description || "",
      timeLimit: initialData?.timeLimit || DUNGEON_DEFAULT.TIME_LIMIT,
      mapDataCheck: 0,
    },
  });

  const { watch, setValue } = methods;
  const formValues = watch();

  const {
    tiles,
    entities,
    rows,
    cols,
    linkingState,
    handleCellClick,
    updateTilesSize,
    getEntityType,
    setRows,
    setCols,
    setTilesState,
    setEntitiesState,
    cancelLinking,
  } = useDungeonEditorLogic(initialData);

  const { canUndo, canRedo, handleUndo, handleRedo, pushHistory, getCurrentSnapshot, setHistory } = useEditorHistory(
    methods,
    tiles,
    entities,
    rows,
    cols,
    setRows,
    setCols,
    setTilesState,
    setEntitiesState,
  );

  // タイル選択状態
  const [selectedTile, setSelectedTile] = useState<TileConfigKey | null>(null);

  // ペアリングの完全キャンセル＆設置済み1個目のギミック削除関数
  const handleCancelLinkingAndRemoveEntity = useCallback(() => {
    if (linkingState.active && linkingState.firstEntityId) {
      const targetId = linkingState.firstEntityId;
      const nextEntities = entities.filter((ent) => ent.id !== targetId);

      setEntitiesState(nextEntities);
      pushHistory({
        ...getCurrentSnapshot(),
        entities: nextEntities,
      });

      toast.info("ペア配置を取り消し、1個目のギミックを削除しました");
    }
    cancelLinking();
    setSelectedTile(null);
  }, [linkingState, entities, setEntitiesState, pushHistory, getCurrentSnapshot, cancelLinking]);

  // Undo / Redo 実行時のペアリング状態解除
  const onUndoAction = useCallback(() => {
    handleUndo();
    if (typeof cancelLinking === "function") {
      cancelLinking();
    }
  }, [handleUndo, cancelLinking]);

  const onRedoAction = useCallback(() => {
    handleRedo();
    if (typeof cancelLinking === "function") {
      cancelLinking();
    }
  }, [handleRedo, cancelLinking]);

  // スクロール位置の初期化
  const resetScrollPosition = useCallback(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    requestAnimationFrame(() => {
      const maxScrollLeft = mainEl.scrollWidth - mainEl.clientWidth;
      const maxScrollTop = mainEl.scrollHeight - mainEl.clientHeight;

      mainEl.scrollLeft = Math.max(0, maxScrollLeft / 2);
      mainEl.scrollTop = Math.max(0, maxScrollTop / 2);
    });
  }, []);

  // マップサイズ変更時や初期ロード時に位置を合わせる
  useEffect(() => {
    resetScrollPosition();
  }, [rows, cols, resetScrollPosition]);

  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 3.0;
  const [zoom, setZoom] = useState(1);

  // 拡大縮小制御
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
        setZoom((prev) => Math.min(Math.max(prev * zoomFactor, MIN_ZOOM), MAX_ZOOM));
      }
    };

    mainEl.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => mainEl.removeEventListener("wheel", handleWheelNative);
  }, [MIN_ZOOM, MAX_ZOOM]);

  // ドラッグ / タッチ移動
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    // 中クリック、Shift+クリック、または背景領域のドラッグでスクロール開始
    if (e.button === 1 || e.shiftKey || (e.target as HTMLElement).tagName === "MAIN") {
      isDraggingRef.current = true;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      startScrollRef.current = { left: mainEl.scrollLeft, top: mainEl.scrollTop };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !mainRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;

    mainRef.current.scrollLeft = startScrollRef.current.left - dx;
    mainRef.current.scrollTop = startScrollRef.current.top - dy;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  useEffect(() => {
    if (!isEditMode && userInfo && !formValues.name) {
      const nickName = userInfo.nickName || userInfo.userName || "Player";
      const nextNumber = (userInfo.activeDungeonCount || 0) + 1;
      const autoGeneratedName = `${nickName}_${String(nextNumber).padStart(3, "0")}`;

      setValue("name", autoGeneratedName, { shouldValidate: true });

      const snap = getCurrentSnapshot();
      snap.name = autoGeneratedName;
      setHistory([snap]);
    }
  }, [userInfo, isEditMode, setValue, getCurrentSnapshot, setHistory]);

  // キーボードショートカット（Undo/Redo & Escで選択解除）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (linkingState.active) {
          handleCancelLinkingAndRemoveEntity();
        } else {
          setSelectedTile(null);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndoAction();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        onRedoAction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndoAction, onRedoAction, linkingState.active, handleCancelLinkingAndRemoveEntity]);

  // 消しゴム選択時のペアリング解除自動処理
  useEffect(() => {
    if (selectedTile === " " && linkingState.active) {
      handleCancelLinkingAndRemoveEntity();
    }
  }, [selectedTile, linkingState.active, handleCancelLinkingAndRemoveEntity]);

  useEffect(() => {
    if (linkingState.active && linkingState.pendingType) {
      const targetTile = ENTITY_TYPE_TO_TILE[linkingState.pendingType];
      if (targetTile) {
        setSelectedTile(targetTile);
      }
    }
  }, [linkingState.active, linkingState.pendingType]);

  const handleCanvasAction = useCallback(
    (r: number, c: number) => {
      // タイル未選択時の操作を無効化
      if (selectedTile === null || r <= 0 || r >= rows - 1 || c <= 0 || c >= cols - 1) {
        return;
      }
      if (selectedTile !== " " && TILE_CONFIG[selectedTile]?.category === TILE_CATEGORIES.PLAYER) {
        const hasPlayer = tiles.flat().some((t) => TILE_CONFIG[t]?.category === TILE_CATEGORIES.PLAYER);
        if (hasPlayer) return toast.error("プレイヤーは1つのみです");
      }

      // 最新の計算結果を受け取る
      const result = handleCellClick(r, c, selectedTile);
      if (!result) return;

      const { nextTiles, nextEntities } = result;

      // 履歴に保存
      const nextSnapshot = {
        ...getCurrentSnapshot(),
        tiles: nextTiles,
        entities: nextEntities,
      };
      pushHistory(nextSnapshot);
    },
    [handleCellClick, selectedTile, tiles, rows, cols, getCurrentSnapshot, pushHistory],
  );

  const { images, isLoaded } = useTileImages();

  const getLinkingGuideMessage = () => {
    if (!linkingState.active || !linkingState.pendingType) return null;
    return LINKING_GUIDE_MESSAGES[linkingState.pendingType] ?? "ペアとなるギミックを配置してください";
  };

  return (
    <>
      {/* FormProviderで囲み、子コンポーネントがContext経由でReact Hook Formを扱えるようにする */}
      <FormProvider {...methods}>
        {/* onSubmitのデフォルト挙動を無効化 */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative h-[calc(100vh-3.5rem)] w-full bg-slate-950 text-white overflow-hidden select-none flex flex-col"
        >
          {/* ─── ヘッダー ─── */}
          <header className="z-40 w-full shrink-0 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-2">
            <EditorInfoHeader
              isAdmin={isAdmin}
              status={initialData?.status ?? "DRAFT"}
              cols={cols}
              rows={rows}
              onConfigConfirm={() => pushHistory()}
              onSizeChange={(r, c) => {
                setRows(r);
                setCols(c);
                updateTilesSize(r, c);
              }}
              initialData={initialData}
              user={user}
              tiles={tiles}
              entities={entities}
              linkingState={linkingState}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={onUndoAction}
              onRedo={onRedoAction}
            />
          </header>

          {/* ─── メインレイアウト ─── */}
          <div className="relative flex-1 min-h-0 w-full overflow-hidden">
            {/* 左サイドバー */}
            <div className="absolute top-4 left-4 z-30 pointer-events-auto">
              <div className="flex flex-col gap-3 relative">
                <TilePalette
                  selectedTile={selectedTile}
                  isEditMode={isEditMode}
                  onSelect={(id) => {
                    // パレット内のアイテム操作時にダンジョン情報パネルを閉じる
                    setIsMetadataOpen(false);

                    if (linkingState.active && id !== " " && getEntityType(id) !== linkingState.pendingType) {
                      return toast.error("セット設置を優先するか、消しゴムでキャンセルしてください");
                    }
                    setSelectedTile((prev) => (prev === id ? null : id));
                  }}
                  isMetadataOpen={isMetadataOpen}
                  onCurrentTileInActiveGroupChange={setIsTileInActivePalette}
                  onGroupChange={() => setIsMetadataOpen(false)}
                />

                <button
                  type="button"
                  onClick={() => setIsMetadataOpen((prev) => !prev)}
                  title="ダンジョン情報"
                  className={`w-12 h-12 rounded-2xl border transition-all duration-200 shadow-2xl flex items-center justify-center shrink-0 group relative ${
                    isMetadataOpen
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-slate-900/90 backdrop-blur-md border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <Info className="w-5 h-5" />
                  <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-xs text-slate-200 border border-slate-800 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                    ダンジョン情報
                  </span>
                </button>

                {isMetadataOpen && (
                  <div className="absolute top-16 left-16 z-50 w-[calc(100vw-80px)] max-w-[300px] sm:max-w-[320px] animate-in fade-in slide-in-from-left-2 duration-150">
                    <DungeonMetadataCard
                      initialData={initialData}
                      isEditMode={isEditMode}
                      isAdmin={isAdmin}
                      defaultOpen={true}
                      onClose={() => setIsMetadataOpen(false)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* メインエリア：キャンバス本体 */}
            <main
              ref={mainRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-full overflow-auto relative cursor-grab active:cursor-grabbing custom-scrollbar bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] flex"
            >
              <div className="m-auto shrink-0 flex items-center justify-center p-[600px]">
                <div
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                  }}
                  className="will-change-transform shrink-0"
                >
                  <DungeonCanvasView
                    key={`${rows}-${cols}`}
                    tiles={tiles}
                    entities={entities}
                    rows={rows}
                    cols={cols}
                    images={images}
                    isLoaded={isLoaded}
                    linkingState={linkingState}
                    onCanvasAction={handleCanvasAction}
                    selectedTile={selectedTile}
                  />
                </div>
              </div>
            </main>

            {/* ─── 画面上部中央：ステータス＆選択中通知 ─── */}
            {linkingState.active ? (
              <button
                type="button"
                onClick={handleCancelLinkingAndRemoveEntity}
                className="group absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2.5 bg-amber-500/10 hover:bg-rose-500/20 backdrop-blur-xl border-2 border-amber-500/80 hover:border-rose-500 rounded-2xl px-3.5 py-2 sm:px-5 sm:py-2.5 shadow-2xl shadow-amber-500/10 transition-all duration-200 cursor-pointer max-w-[calc(100vw-2rem)] w-max"
                aria-label="ペアリング状態を解除し、設置ギミックを削除"
              >
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 group-hover:bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 group-hover:bg-rose-500 transition-colors"></span>
                </span>

                <p className="text-xs sm:text-sm font-bold text-amber-400 group-hover:text-rose-300 tracking-wide transition-colors flex items-center gap-2 whitespace-normal sm:whitespace-nowrap leading-tight text-left min-w-0">
                  {/* ペアリング用メッセージ */}
                  <span className="group-hover:hidden">
                    {getLinkingGuideMessage()}
                    {/* タッチデバイスの時だけ末尾に追加 */}
                    <span className="inline pointer-fine:hidden text-[10px] sm:text-xs opacity-80 ml-1">
                      （タップで取り消し）
                    </span>
                  </span>

                  {/* ホバー時メッセージ */}
                  <span className="hidden group-hover:inline-flex items-center gap-1.5 text-rose-300 font-extrabold">
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>クリックでペアリング解除＆1個目のギミックを削除</span>
                  </span>
                </p>

                <X className="w-4 h-4 text-amber-400 group-hover:text-rose-300 group-hover:scale-110 transition-all ml-0.5 shrink-0" />
              </button>
            ) : (
              // 選択中のタイルが現在のパレット内に存在しない、かつ、タイルが選択中の時のみ表示
              !isTileInActivePalette &&
              selectedTile !== null && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center group">
                  <button
                    type="button"
                    onClick={() => setSelectedTile(null)}
                    className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-rose-950/90 border border-cyan-500/50 hover:border-rose-500/80 rounded-full px-4 py-1.5 shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer"
                    aria-label="選択状態を解除"
                  >
                    <span className="text-[10px] font-bold text-cyan-400 group-hover:text-rose-400 uppercase tracking-wider transition-colors shrink-0">
                      選択中:
                    </span>

                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-black/40 border border-slate-700/60 group-hover:border-rose-500/50 shrink-0 overflow-hidden transition-colors">
                      {selectedTile === " " ? (
                        <Eraser className="w-4 h-4 text-red-400 group-hover:text-rose-300 transition-colors" />
                      ) : (
                        <TileIconForm tileId={selectedTile} size={24} />
                      )}
                    </div>

                    <X className="w-4 h-4 text-slate-400 group-hover:text-rose-300 group-hover:scale-110 transition-all shrink-0 ml-0.5" />
                  </button>

                  <div className="absolute top-full mt-2 px-2.5 py-1 bg-slate-900/95 text-[11px] font-semibold text-rose-300 border border-rose-500/40 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 shadow-lg backdrop-blur-sm z-50">
                    クリックで解除
                  </div>
                </div>
              )
            )}

            {/* ─── ズームコントローラー ─── */}
            <div className="absolute bottom-4 right-4 z-30 pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 text-xs text-slate-300 shadow-2xl">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(Number((z - 0.1).toFixed(2)), MIN_ZOOM))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors font-bold"
                title="縮小"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                }}
                className="px-2 py-1 rounded-lg hover:bg-slate-800 font-mono text-amber-400 transition-colors"
                title="100%にリセット"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(Number((z + 0.1).toFixed(2)), MAX_ZOOM))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors font-bold"
                title="拡大"
              >
                +
              </button>
            </div>
          </div>
        </form>
      </FormProvider>
    </>
  );
}
