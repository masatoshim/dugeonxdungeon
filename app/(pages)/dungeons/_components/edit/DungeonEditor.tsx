"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Info } from "lucide-react";

import { DUNGEON_DEFAULT, TILE_CATEGORIES } from "@/game-core/types";
import { TILE_CONFIG, TileConfigKey } from "@/game-core/master";
import { EditorInfoHeader, TilePalette } from "@/app/(pages)/dungeons/_components";
import { useGetUser } from "@/app/_hooks";
import { useTileImages, useDungeonEditorLogic, useEditorHistory } from "@/app/(pages)/dungeons/_hook";
import { DungeonCanvasView } from "./DungeonCanvasView";
import { DungeonMetadataCard } from "./DungeonMetadataCard";
import { DungeonResponse } from "@/app/_types";

// Zodによるバリデーションスキーマ
const dungeonSchema = z.object({
  code: z.string(),
  name: z.string().min(1, "ダンジョン名は必須入力です").max(50, "ダンジョン名は50文字以内で入力してください"),
  description: z.string().max(1000, "説明文は1000文字以内で入力してください"),
  timeLimit: z
    .number()
    .min(10, "制限時間は10秒以上に設定してください")
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

  // ダンジョンの初期位置を指定
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

  // 編集履歴キーボードショートカット（Undo / Redo）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [onUndoAction, onRedoAction]);

  // タイル配置アクション
  const [selectedTile, setSelectedTile] = useState<TileConfigKey | null>(null);

  // 消しゴム選択時にペアリングタイル1個目のギミック削除＋ペアリング解除 ───
  useEffect(() => {
    // ペアリング待機中 かつ 1個目のIDが存在し、消しゴムが選択された場合
    if (selectedTile === " " && linkingState.active && linkingState.firstEntityId) {
      const targetId = linkingState.firstEntityId;

      // 1個目に配置したギミックを特定
      const targetEntity = entities.find((ent) => ent.id === targetId);

      if (targetEntity) {
        // 対象のエンティティを除外
        const nextEntities = entities.filter((ent) => ent.id !== targetId);

        const nextTiles = tiles;

        // State更新
        setTilesState(nextTiles);
        setEntitiesState(nextEntities);

        // 履歴登録
        pushHistory({
          ...getCurrentSnapshot(),
          tiles: nextTiles,
          entities: nextEntities,
        });
      }

      // ペアリング待機状態を解除
      if (typeof cancelLinking === "function") {
        cancelLinking();
      }

      toast.info("ペア配置を取り消し、1個目のギミックを削除しました");
    }
  }, [
    selectedTile,
    linkingState.active,
    linkingState.firstEntityId,
    tiles,
    entities,
    setTilesState,
    setEntitiesState,
    pushHistory,
    getCurrentSnapshot,
    cancelLinking,
  ]);

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
                  isMetadataOpen={isMetadataOpen}
                  onHoverChange={(isHovered) => {
                    if (isHovered) setIsMetadataOpen(false);
                  }}
                  onSelect={(id) => {
                    if (linkingState.active && id !== " " && getEntityType(id) !== linkingState.pendingType) {
                      return toast.error("セット設置を優先するか、消しゴムでキャンセルしてください");
                    }
                    setSelectedTile(id);
                  }}
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
                  <div className="absolute top-0 left-15 z-40 w-80 animate-in fade-in slide-in-from-left-2 duration-150">
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-4 max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar">
                      <DungeonMetadataCard
                        initialData={initialData}
                        isEditMode={isEditMode}
                        isAdmin={isAdmin}
                        defaultOpen={true}
                      />
                    </div>
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

            {/* ─── ギミック連携ガイド通知 ─── */}
            {linkingState.active && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="bg-amber-500/10 backdrop-blur-xl border-2 border-amber-500/80 rounded-2xl px-6 py-3 shadow-2xl shadow-amber-500/10 flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <p className="text-sm font-bold text-amber-400 tracking-wide">
                    {getLinkingGuideMessage()} （消しゴムで取り消し）
                  </p>
                </div>
              </div>
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
                  // resetScrollPosition(); // スクロールバーの位置も初期状態に自動復帰
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
