import { Save, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useCreateDungeon, useUpdateDungeon } from "@/app/_hooks";
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
  linkingState: { active: boolean; [key: string]: any };
};

export const SaveActionGroup = ({ initialData, isAdmin, user, tiles, entities, rows, cols, linkingState }: Props) => {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const isEditMode = !!initialData?.id;
  const status = initialData?.status ?? "DRAFT";

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useFormContext<DungeonFormData>();
  const { create, isCreating } = useCreateDungeon();
  const { update, isUpdating } = useUpdateDungeon(initialData?.id || "");
  const isSaving = isCreating || isUpdating;

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
        savedDungeon = await update({
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
        });
      } else {
        const { mapDataCheck, ...rest } = data;
        savedDungeon = await create({
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
        });
      }

      const targetId = savedDungeon?.id || initialData?.id;
      if (targetId) {
        await mutate(`/api/dungeons/${targetId}`, savedDungeon, { revalidate: true });
        if (isRedirectingToTest) {
          router.refresh();
          router.push(`/dungeons/${targetId}/test-play`);
          return;
        }
      }
      if (!isRedirectingToTest) reset(data);
    } catch (e) {}
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleSubmit((data) => onSubmitSave(data, false))}
        disabled={(isEditMode && !isDirty) || isSaving}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed rounded-md text-xs font-bold transition-all border border-slate-700 focus:border-cyan-500 outline-none text-slate-200 shrink-0 enabled:active:scale-95"
        title="下書き保存"
      >
        <Save size={12} />
        {isSaving && "保存中..."}
      </button>

      <button
        type="button"
        onClick={async () => {
          if (isDirty || !isEditMode) {
            handleSubmit((data) => onSubmitSave(data, true))();
          } else {
            router.push(`/dungeons/${initialData.id}/test-play?v=${Date.now()}`);
          }
        }}
        className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 rounded-md text-xs font-black shadow-lg shadow-cyan-500/10 border border-transparent focus:border-white/40 outline-none transition-all text-slate-950 active:scale-95 shrink-0"
      >
        <Play size={12} fill="currentColor" />
        {status === "DRAFT" || isDirty ? "テストプレイして公開" : "テストプレイ"}
      </button>
    </div>
  );
};
