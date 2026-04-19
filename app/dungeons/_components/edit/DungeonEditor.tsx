import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { DUNGEON_DEFAULT, TILE_CONFIG, TileConfigKey, TILE_CATEGORIES } from "@/types";
import { EditorHeader, TilePalette } from "@/app/dungeons/_components";
import { useCreateDungeon, useUpdateDungeon, useDeleteDungeon } from "@/app/_hooks";
import { useTileImages, useDungeonEditorLogic } from "@/app/dungeons/_hook";
import { DungeonCanvasView } from "./DungeonCanvasView";

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

  // ダンジョン編集ロジック取得
  const {
    tiles,
    entities,
    rows,
    cols,
    linkingState,
    handleCellClick,
    updateTilesSize,
    getEntityType,
    setRows, // Headerの表示用などで必要な場合
    setCols,
  } = useDungeonEditorLogic(initialData);

  // 保存
  const onSubmit = useCallback(
    async (data: DungeonFormData, isRedirectingToTest: boolean) => {
      if (linkingState.active) return toast.error("パーツのペアを完成させてください");

      const flatTiles = tiles.flat();
      if (!flatTiles.some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.PLAYER))
        return toast.error("プレイヤーを設置してください");
      if (!flatTiles.some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.GOAL))
        return toast.error("ゴールを設置してください");

      const { mapDataCheck, ...rest } = data; // 隠しフィールドを除外
      const payload = {
        ...rest,
        ...(isEditMode && { version: initialData.version + 1 }),
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
          await mutate(`/api/dungeons/${targetId}`, savedDungeon, {
            revalidate: true, // 強制再取得
          });
          // テストプレイボタンからの実行だった場合
          if (isRedirectingToTest) {
            router.refresh();
            router.push(`/dungeons/${targetId}/test-play`);
            return;
          }
        }

        if (!isRedirectingToTest) {
          reset(data);
        }

        if (isAdmin) {
          router.push("/admin/dashboard/dungeons");
          return;
        } else {
          router.push("/dashboard/dungeons");
        }
      } catch (e) {
        // todo: エラーはHooks内のtoastで処理
      }
    },
    [tiles, entities, rows, cols, user, isEditMode, initialData, linkingState.active],
  );

  // テストプレイボタン押下時のハンドラー
  const handleTestPlay = async () => {
    if (isDirty || !isEditMode) {
      handleSubmit((data) => onSubmit(data, true))();
    } else {
      router.push(`/dungeons/${initialData.id}/test-play?v=${Date.now()}`);
    }
  };

  // ダンジョンの物理削除（管理者のみ）
  const handleDelete = async () => {
    if (!isAdmin) {
      toast.error("削除処理が実行できません");
    }
    await remove();
    router.push("/admin/dashboard/dungeons");
  };

  // キャンバスに対する操作を統合
  const [selectedTile, setSelectedTile] = useState("W");
  const handleCanvasAction = useCallback(
    (r: number, c: number) => {
      // ロジック側のタイル更新
      handleCellClick(r, c, selectedTile);
      // フォームのDirtyフラグを立てる
      setValue("mapDataCheck", `tile-${r}-${c}-${Date.now()}`, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [handleCellClick, selectedTile, setValue],
  );
  const { images, isLoaded } = useTileImages();

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
            onConfigChange={(k, v, b) => setValue(k as any, v, { shouldDirty: b, shouldValidate: true })}
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
                handleDelete();
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
              <DungeonCanvasView
                tiles={tiles}
                entities={entities}
                rows={rows}
                cols={cols}
                images={images}
                isLoaded={isLoaded}
                linkingState={linkingState}
                onCanvasAction={handleCanvasAction}
              />
            </main>
          </div>
        </form>
      </div>
    </div>
  );
}
