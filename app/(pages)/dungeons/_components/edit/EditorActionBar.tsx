import { Save, Play, Trash2, ArrowLeft } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useCreateDungeon, useUpdateDungeon, useDeleteDungeon } from "@/app/_hooks";
import { TILE_CONFIG, TileConfigKey, TILE_CATEGORIES, DungeonResponse } from "@/types";
import { DungeonFormData } from "./DungeonEditor";

type Props = {
  initialData?: DungeonResponse;
  isAdmin: boolean;
  user: { id: string; role?: string; [key: string]: any };
  tiles: string[][];
  entities: any;
  rows: number;
  cols: number;
  linkingState: {
    active: boolean;
    mode: "KEY_DOOR" | "BUTTON_DOOR" | null;
    pendingType: "KEY" | "DOOR" | "BUTTON" | null;
    firstEntityId: string | null;
  };
};

export const EditorActionBar = ({ initialData, isAdmin, user, tiles, entities, rows, cols, linkingState }: Props) => {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const isEditMode = !!initialData?.id;

  const {
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useFormContext<DungeonFormData>();

  const { create, isCreating } = useCreateDungeon();
  const { update, isUpdating } = useUpdateDungeon(initialData?.id || "");
  const { remove, isDeleting } = useDeleteDungeon(initialData?.id || "");

  const isSaving = isCreating || isUpdating;
  const status = initialData?.status ?? "DRAFT";

  const onSubmitSave = async (data: DungeonFormData, isRedirectingToTest: boolean) => {
    if (linkingState.active) return toast.error("パーツのペアを完成させてください");

    const flatTiles = tiles.flat();
    if (!flatTiles.some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.PLAYER))
      return toast.error("プレイヤーを設置してください");
    if (!flatTiles.some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.GOAL))
      return toast.error("ゴールを設置してください");

    try {
      let savedDungeon: any;
      if (isEditMode) {
        const { mapDataCheck, ...rest } = data;
        const payload = {
          ...rest,
          versionMajor: (initialData.versionMajor ?? 0) + 1,
          mapData: {
            tiles: tiles.map((row) => row.map((c) => (c === ".." ? " " : c))),
            entities,
            width: cols,
            height: rows,
          },
          mapSizeHeight: rows,
          mapSizeWidth: cols,
          mapSize: cols * rows,
          difficulty: initialData.difficulty,
          status: "DRAFT" as const,
          tagIds: [],
          createdBy: isEditMode ? initialData.createdBy : user.id,
          updatedBy: user.id,
        };
        savedDungeon = await update(payload);
      } else {
        const { mapDataCheck, ...rest } = data;
        const payload = {
          ...rest,
          code: `DN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          userId: user.id,
          mapData: {
            tiles: tiles.map((row) => row.map((c) => (c === ".." ? " " : c))),
            entities,
            width: cols,
            height: rows,
          },
          mapSizeHeight: rows,
          mapSizeWidth: cols,
          mapSize: cols * rows,
          difficulty: 3,
          status: "DRAFT" as const,
          isTemplate: isAdmin || user.role === "ADMIN",
          tagIds: [],
          createdBy: user.id,
          updatedBy: user.id,
        };
        savedDungeon = await create(payload);
      }

      const targetId = savedDungeon?.id || initialData?.id;
      if (targetId) {
        await mutate(`/api/dungeons/${targetId}`, savedDungeon, {
          revalidate: true,
        });
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
        return;
      }
    } catch (e) {
      // エラーはHooks内のtoastで処理される想定
    }
  };

  const handleTestPlay = async () => {
    if (isDirty || !isEditMode) {
      handleSubmit((data) => onSubmitSave(data, true))();
    } else {
      router.push(`/dungeons/${initialData.id}/test-play?v=${Date.now()}`);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      return toast.error("削除処理が実行できません");
    }
    await remove();
    router.push("/admin/dashboard/dungeons");
  };

  const handleOnDeleteClick = async (physical: boolean) => {
    if (physical) {
      if (window.confirm("管理者権限：物理削除を実行します。復元できませんがよろしいですか？")) {
        handleDelete();
      }
    } else {
      if (window.confirm("このダンジョンを削除しますか？")) {
        const payload = {
          status: "DELETED" as const,
          deletedFlg: true,
          updatedBy: user?.id || initialData?.userId,
        };
        await update(payload);
        router.push(isAdmin ? "/admin/dashboard/dungeons" : "/dashboard/dungeons");
      }
    }
  };

  return (
    <div className="flex flex-col justify-between items-end gap-4 w-full h-full lg:border-l lg:border-slate-800 lg:pl-4">
      <button
        type="button"
        onClick={() => {
          if (isDirty && !window.confirm("変更が保存されていません。終了しますか？")) return;
          router.push(isAdmin ? "/admin/dashboard/dungeons" : "/dashboard/dungeons");
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-950/20 hover:bg-slate-800 border border-slate-800 focus:border-cyan-500 rounded-lg transition-all outline-none focus:ring-1 focus:ring-cyan-500/30 shrink-0"
      >
        <ArrowLeft size={14} />
        <span>管理画面に戻る</span>
      </button>

      <div className="flex flex-wrap items-center justify-end gap-2 w-full">
        {isEditMode && (
          <div className="flex items-center gap-1 border-r border-slate-800 pr-2 mr-1">
            <button
              type="button"
              onClick={() => handleOnDeleteClick(false)}
              disabled={isDeleting}
              className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-950/30 border border-transparent focus:border-red-500/50 rounded-lg transition-all outline-none disabled:opacity-20"
              title="削除"
            >
              <Trash2 size={15} />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleOnDeleteClick(true)}
                disabled={isDeleting}
                className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600 focus:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold border border-red-600/30 focus:border-red-500 outline-none transition-all disabled:opacity-20 shrink-0"
              >
                完全削除
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit((data) => onSubmitSave(data, false))}
          disabled={(isEditMode && !isDirty) || isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all border border-slate-700 focus:border-cyan-500 outline-none text-slate-200 shrink-0 enabled:active:scale-95"
        >
          <Save size={13} />
          {isSaving ? "保存中..." : "下書き保存"}
        </button>

        <button
          type="button"
          onClick={handleTestPlay}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-xs font-black shadow-lg shadow-cyan-500/10 border border-transparent focus:border-white/40 outline-none transition-all text-slate-950 active:scale-95 shrink-0"
        >
          <Play size={13} fill="currentColor" />
          {status === "DRAFT" || isDirty ? "テストプレイして公開" : "テストプレイ"}
        </button>
      </div>
    </div>
  );
};
