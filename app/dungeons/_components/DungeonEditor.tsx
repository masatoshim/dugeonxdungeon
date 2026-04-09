import { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { DUNGEON_DEFAULT, TILE_CONFIG, EntityData, TileConfigKey, TILE_CATEGORIES } from "@/types";
import { TileIconForm, EditorHeader, TilePalette } from "@/app/dungeons/_components";
import { useCreateDungeon, useUpdateDungeon, useDeleteDungeon } from "@/app/_hooks";

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
  const router = useRouter();
  const isEditMode = !!initialData?.id;

  // テストプレイ遷移用の一時ステート
  const [isRedirectingToTest, setIsRedirectingToTest] = useState(false);
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

  const [selectedTile, setSelectedTile] = useState("W");
  const [entities, setEntities] = useState<EntityData[]>(initialData?.mapData?.entities || []);
  const [linkingState, setLinkingState] = useState<LinkingState>({
    active: false,
    mode: null,
    pendingType: null,
    firstEntityId: null,
  });

  const currentTileConfig = useMemo(() => TILE_CONFIG[selectedTile as TileConfigKey], [selectedTile]);

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

  // 保存・削除
  const { data: session } = useSession();
  const onSubmit = async (data: DungeonFormData) => {
    if (linkingState.active) return toast.error("パーツのペアを完成させてください");

    const flatTiles = tiles.flat();
    if (!flatTiles.some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.PLAYER))
      return toast.error("プレイヤーを設置してください");
    if (!flatTiles.some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.GOAL))
      return toast.error("ゴールを設置してください");

    const user = session?.user;
    if (!user) return toast.error("セッションが切断されました。再ログインしてください。");
    const { mapDataCheck, ...rest } = data; // 隠しフィールドを除外
    const payload = {
      ...rest,
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
      status: isEditMode ? initialData.status : "DRAFT",
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

      reset(data);

      // テストプレイボタンからの実行だった場合
      if (isRedirectingToTest) {
        // savedDungeon から最新の ID を取得（作成直後は ID が新しく発行されるため）
        const targetId = savedDungeon?.id || initialData?.id;
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
      setIsRedirectingToTest(true);
      // handleSubmit を手動で実行
      handleSubmit(onSubmit)();
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
        <form onSubmit={handleSubmit(onSubmit)}>
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
              setIsRedirectingToTest(false);
              handleSubmit(onSubmit)();
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
              <div
                className="inline-grid gap-0 shadow-2xl ring-4 ring-black bg-gray-800 m-auto"
                style={{ gridTemplateColumns: `repeat(${cols}, 32px)` }}
              >
                {tiles.map((row, r) =>
                  row.map((cell, c) => {
                    const entityAtPos = entities.find((e) => e.x === c && e.y === r);
                    const isPendingFirst = entityAtPos?.id === linkingState.firstEntityId;
                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseDown={() => handleCellClick(r, c)}
                        onMouseEnter={(e) => e.buttons === 1 && handleCellClick(r, c)}
                        className={`w-8 h-8 border-[0.1px] border-white/5 relative transition-colors hover:bg-white/10 cursor-crosshair
                          ${isPendingFirst ? "ring-2 ring-inset ring-amber-500 bg-amber-500/20" : ""}
                        `}
                      >
                        <TileIconForm tileId={cell} size={32} />
                        {entityAtPos && (
                          <div className="absolute inset-0 pointer-events-none">
                            <TileIconForm tileId={entityAtPos.properties?.tileId || ""} size={32} />
                          </div>
                        )}
                      </div>
                    );
                  }),
                )}
              </div>
            </main>
          </div>
        </form>
      </div>
    </div>
  );
}
