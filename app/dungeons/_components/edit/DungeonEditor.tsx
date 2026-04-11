import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { DUNGEON_DEFAULT, TILE_CONFIG, EntityData, TileConfigKey, TILE_CATEGORIES } from "@/types";
import { EditorHeader, TilePalette } from "@/app/dungeons/_components";
import { useCreateDungeon, useUpdateDungeon, useDeleteDungeon } from "@/app/_hooks";
import { useTileImages } from "@/app/dungeons/_hook/useTileImages";

// Zodによるバリデーションスキーマ
const dungeonSchema = z.object({
  name: z.string().min(1, "ダンジョン名は必須入力です").max(50, "ダンジョン名は50文字以内で入力してください"),
  description: z.string().max(1000, "説明文は1000文字以内で入力してください"),
  timeLimit: z
    .number()
    .min(10, "制限時間は10秒以上に設定してください")
    .max(3600, "制限時間は1時間以内に設定してください"),
  mapDataCheck: z.any(), // 変更検知用の隠しフィールド（バリデーションは通すだけ）
});

type DungeonFormData = z.infer<typeof dungeonSchema>;

// セット設置の状態管理型
type LinkingState = {
  active: boolean;
  mode: "KEY_DOOR" | "BUTTON_DOOR" | null;
  pendingType: "KEY" | "DOOR" | "BUTTON" | null;
  firstEntityId: string | null;
};

interface DungeonEditorProps {
  initialData?: any; // 編集時は既存データが入る
  isAdmin: boolean;
}

export function DungeonEditor({ initialData, isAdmin }: DungeonEditorProps) {
  const { data: session } = useSession();
  const user = session?.user;
  if (!user) return toast.error("セッションが切断されました。再ログインしてください。");

  const router = useRouter();
  const { mutate } = useSWRConfig(); // キャッシュ操作用
  const isEditMode = !!initialData?.id;

  // API Hooks の初期化
  const { create, isCreating } = useCreateDungeon();
  const { update, isUpdating } = useUpdateDungeon(initialData?.id || "");
  const { remove, isDeleting } = useDeleteDungeon(initialData?.id || "");

  // React Hook Form の初期化
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<DungeonFormData>({
    resolver: zodResolver(dungeonSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      timeLimit: initialData?.timeLimit || DUNGEON_DEFAULT.TIME_LIMIT,
      mapDataCheck: JSON.stringify(initialData?.mapData?.tiles || []),
    },
  });

  const formValues = watch();

  // マップ情報を初期化
  const [rows, setRows] = useState(initialData?.mapData?.height || DUNGEON_DEFAULT.ROWS);
  const [cols, setCols] = useState(initialData?.mapData?.width || DUNGEON_DEFAULT.COLS);
  const [tiles, setTiles] = useState<string[][]>(() => {
    if (initialData?.mapData?.tiles) return initialData.mapData.tiles;
    return Array(DUNGEON_DEFAULT.ROWS)
      .fill(0)
      .map((_, r) =>
        Array(DUNGEON_DEFAULT.COLS)
          .fill(0)
          .map((_, c) =>
            r === 0 || r === DUNGEON_DEFAULT.ROWS - 1 || c === 0 || c === DUNGEON_DEFAULT.COLS - 1 ? "W" : "..",
          ),
      );
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { images, isLoaded } = useTileImages();
  const TILE_SIZE = 32;

  const [selectedTile, setSelectedTile] = useState("W");
  const [entities, setEntities] = useState<EntityData[]>(initialData?.mapData?.entities || []);
  const [linkingState, setLinkingState] = useState<LinkingState>({
    active: false,
    mode: null,
    pendingType: null,
    firstEntityId: null,
  });

  const currentTileConfig = useMemo(() => TILE_CONFIG[selectedTile as TileConfigKey], [selectedTile]);

  /**
   * 画面操作
   */

  // ダンジョンサイズ変更
  const updateTilesSize = (newRows: number, newCols: number) => {
    setTiles((prev) => {
      const oldRows = prev.length;
      const oldCols = prev[0].length;
      const nextTiles = Array(newRows)
        .fill(0)
        .map(() => Array(newCols).fill(".."));
      for (let r = 0; r < newRows; r++) {
        for (let c = 0; c < newCols; c++) {
          if (r < oldRows && c < oldCols) {
            const isOldEdge = r === 0 || r === oldRows - 1 || c === 0 || c === oldCols - 1;
            if (!isOldEdge) nextTiles[r][c] = prev[r][c];
          }
          if (r === 0 || r === newRows - 1 || c === 0 || c === newCols - 1) nextTiles[r][c] = "W";
        }
      }
      setValue("mapDataCheck", `tiles-${Date.now()}`, { shouldDirty: true });
      return nextTiles;
    });
    setEntities((prev) => prev.filter((e) => e.x < newCols - 1 && e.y < newRows - 1));
  };

  /**
   * 設置しようとしているタイルがどのエンティティタイプかを判定
   */
  const getEntityType = (tileId: string) => {
    if (tileId.startsWith("K1")) return "KEY";
    if (tileId.startsWith("KD1")) return "DOOR";
    if (tileId.startsWith("B1")) return "BUTTON";
    if (tileId.startsWith("D1")) return "DOOR";
    return null;
  };
  /**
   * セルクリック時のバリデーションと設置ロジック
   */
  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) return;
      const isEraser = selectedTile === "..";
      const category = currentTileConfig?.category;
      const isGimmick = category === TILE_CATEGORIES.GIMMICK;
      const incomingType = getEntityType(selectedTile);

      if (linkingState.active && !isEraser) {
        if (!isGimmick || incomingType !== linkingState.pendingType) {
          return toast.error("セット設置を優先してください");
        }
      }

      if (category === TILE_CATEGORIES.PLAYER) {
        const hasPlayer = tiles
          .flat()
          .some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.PLAYER);
        if (hasPlayer) return toast.error("プレイヤーは1つのみです");
      }

      const newId = `${selectedTile}_${crypto.randomUUID().slice(0, 8)}`;
      setTiles((prev) => {
        const next = [...prev];
        next[r] = [...next[r]];
        next[r][c] = isGimmick ? ".." : selectedTile;
        setValue("mapDataCheck", `tile-${r}-${c}-${Date.now()}`, { shouldDirty: true });
        return next;
      });

      setEntities((prev) => {
        const filtered = prev.filter((e) => !(e.x === c && e.y === r));
        if (isEraser) return filtered;
        if (isGimmick && incomingType) {
          const newEntity: EntityData = {
            id: newId,
            type: incomingType,
            x: c,
            y: r,
            properties: { tileId: selectedTile },
          };
          if (!linkingState.active) {
            const mode = incomingType === "KEY" || selectedTile === "KD1" ? "KEY_DOOR" : "BUTTON_DOOR";
            const pendingType = incomingType === "DOOR" ? (mode === "KEY_DOOR" ? "KEY" : "BUTTON") : "DOOR";
            setLinkingState({ active: true, mode, pendingType, firstEntityId: newId });
            return [...filtered, newEntity];
          } else {
            const firstId = linkingState.firstEntityId;
            setLinkingState({ active: false, mode: null, pendingType: null, firstEntityId: null });
            const updatedPrev = filtered.map((e) =>
              e.id === firstId ? { ...e, properties: { ...e.properties, targetId: newId } } : e,
            );
            return [...updatedPrev, { ...newEntity, properties: { ...newEntity.properties, targetId: firstId! } }];
          }
        }
        return filtered;
      });
    },
    [rows, cols, selectedTile, currentTileConfig, linkingState, tiles],
  );

  // 描画ロジック
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = c * TILE_SIZE;
        const dy = r * TILE_SIZE;
        const tileId = tiles[r][c];
        const img = images[tileId];
        const config = TILE_CONFIG[tileId as TileConfigKey];

        // 床などの基本タイルを描画
        if (img && config) {
          // frame情報（0, 1, 2...）から画像内のX座標を計算する
          // 例: 32px幅のタイルが横に並んでいる場合
          const frameIndex = config.frame || 0;
          const sx = frameIndex * TILE_SIZE;
          const sy = 0; // 縦にも並んでいるなら (Math.floor(frameIndex / 横の数) * TILE_SIZE)

          ctx.drawImage(
            img,
            sx,
            sy,
            TILE_SIZE,
            TILE_SIZE, // ソース：frame位置に基づいて切り取り
            dx,
            dy,
            TILE_SIZE,
            TILE_SIZE, // デスティネーション：Canvas上の配置位置
          );
        }

        // エンティティ（鍵や扉）が重なっている場合
        const entity = entities.find((e) => e.x === c && e.y === r);
        if (entity && typeof tileId === "string" && images[tileId]) {
          ctx.drawImage(images[tileId], dx, dy, TILE_SIZE, TILE_SIZE);
        }

        // セット設置中のハイライト
        const entityAtPos = entities.find((e) => e.x === c && e.y === r);
        if (entityAtPos?.id === linkingState.firstEntityId) {
          ctx.strokeStyle = "#f59e0b"; // amber-500
          ctx.lineWidth = 2;
          ctx.strokeRect(dx + 2, dy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.fillStyle = "rgba(245, 158, 11, 0.2)";
          ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
        }

        // グリッド線の描画 (薄く)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(dx, dy, TILE_SIZE, TILE_SIZE);
      }
    }
  }, [tiles, entities, rows, cols, isLoaded, images, linkingState.firstEntityId]);

  // state更新時に再描画
  useEffect(() => {
    draw();
  }, [draw]);

  // --- クリック座標計算 ---
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const c = Math.floor(x / TILE_SIZE);
    const r = Math.floor(y / TILE_SIZE);

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      handleCellClick(r, c);
    }
  };

  /**
   *
   * @param data
   * @param isRedirectingToTest
   * @returns
   */
  // 保存・削除
  const onSubmit = async (data: DungeonFormData, isRedirectingToTest: boolean) => {
    if (linkingState.active) return toast.error("パーツのペアを完成させてください");

    const flatTiles = tiles.flat();
    if (!flatTiles.some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.PLAYER))
      return toast.error("プレイヤーを設置してください");
    if (!flatTiles.some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.GOAL))
      return toast.error("ゴールを設置してください");

    const { mapDataCheck, ...rest } = data; // 隠しフィールドを除外
    const payload = {
      ...rest,
      version: isEditMode && initialData.version + 1,
      code: isEditMode ? initialData.code : `DN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      userId: isEditMode ? initialData.userId : user.id,
      mapData: {
        tiles: tiles.map((row) => row.map((c) => (c === ".." ? " " : c))),
        entities,
        width: cols,
        height: rows,
      },
      mapSizeHeight: rows,
      mapSizeWidth: cols,
      mapSize: cols * rows,
      difficulty: isEditMode ? initialData.difficulty : 3,
      status: "DRAFT" as const, // 保存する際は常に編集中に更新
      isTemplate: isAdmin || user.role === "ADMIN",
      tagIds: [], // todo: tagセットのロジックは劣後
      createdBy: isEditMode ? initialData.createdBy : user.id,
      updatedBy: user.id,
    };

    try {
      let savedDungeon: any;
      if (isEditMode) {
        savedDungeon = await update(payload);
      } else {
        savedDungeon = await create(payload);
      }

      // savedDungeonから最新のIDを取得（作成直後はIDが新しく発行されるため）
      const targetId = savedDungeon?.id || initialData?.id;
      if (targetId) {
        // 保存が成功したら、そのダンジョンのキャッシュを即座に更新
        await mutate(`/api/dungeons/${targetId}`);
      }

      reset(data);

      // テストプレイボタンからの実行だった場合
      if (isRedirectingToTest) {
        if (targetId) {
          router.push(`/dungeons/${targetId}/test-play`);
          return;
        }
      }

      if (isAdmin) {
        // todo: 未実装
        // router.push("/admin/dungeons/admin");
        return;
      } else {
        router.push("/dungeons");
      }
    } catch (e) {
      // todo: エラーはHooks内のtoastで処理
    }
  };

  // テストプレイボタン押下時のハンドラー
  const handleTestPlay = async () => {
    // 変更がある場合、または新規作成の場合は保存処理を走らせる
    if (isDirty || !isEditMode) {
      // handleSubmit を手動で実行
      handleSubmit((data) => onSubmit(data, true))();
    } else {
      // 変更がない場合はそのまま遷移
      router.push(`/dungeons/${initialData.id}/test-play`);
    }
  };

  const handleDelete = async () => {
    if (confirm("このダンジョンを削除してもよろしいですか？")) {
      await remove();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
          <EditorHeader
            cols={cols}
            rows={rows}
            config={formValues}
            errors={errors}
            status={initialData?.status ?? "DRAFT"}
            isDirty={isDirty}
            isEditMode={isEditMode}
            isAdmin={isAdmin}
            isSaving={isCreating || isUpdating}
            isDeleting={isDeleting}
            onConfigChange={(k, v) => setValue(k as any, v, { shouldDirty: true, shouldValidate: true })}
            onSizeChange={(r, c) => {
              setRows(r);
              setCols(c);
              updateTilesSize(r, c);
              setValue("mapDataCheck", `size-${r}-${c}-${Date.now()}`, { shouldDirty: true });
            }}
            onSave={() => {
              handleSubmit((data) => onSubmit(data, false))();
            }}
            onTestPlay={handleTestPlay}
            onDelete={(physical) => {
              if (physical) {
                handleDelete;
              } else {
                const payload = {
                  deletedFlg: true,
                  updatedBy: session?.user?.id || initialData.userId,
                };
                update(payload);
              }
            }}
          />

          <div className="flex gap-6 mt-6">
            <aside className="w-64 flex-shrink-0 space-y-4">
              <TilePalette
                selectedTile={selectedTile}
                onSelect={(id) => {
                  if (linkingState.active && getEntityType(id) !== linkingState.pendingType && id !== "..") {
                    return toast.error("セット設置を優先してください");
                  }
                  setSelectedTile(id);
                }}
              />
              {linkingState.active && (
                <div className="bg-amber-900/40 border border-amber-500 p-4 rounded-xl animate-pulse">
                  <p className="text-sm font-bold text-amber-400">Linking Mode</p>
                  <p className="text-xs">{linkingState.pendingType === "DOOR" ? "扉" : "スイッチ"}を配置してください</p>
                </div>
              )}
            </aside>

            <main className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-auto p-12 min-h-[600px] flex">
              <div className="m-auto relative shadow-2xl ring-4 ring-black">
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-amber-500">
                    Loading Assets...
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  width={cols * TILE_SIZE}
                  height={rows * TILE_SIZE}
                  onMouseDown={handleMouseDown}
                  // ドラッグ描画対応
                  onMouseMove={(e) => {
                    if (e.buttons === 1) handleMouseDown(e);
                  }}
                  className="bg-gray-800 cursor-crosshair block"
                />
              </div>
            </main>
          </div>
        </form>
      </div>
    </div>
  );
}
