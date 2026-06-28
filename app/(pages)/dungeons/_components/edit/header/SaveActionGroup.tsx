import { Save, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useCreateDungeon, useUpdateDungeon } from "@/app/_hooks";
import { TILE_CONFIG, TileConfigKey } from "@/game-core/master";
import { TILE_CATEGORIES } from "@/game-core/types";
import { DungeonResponse } from "@/app/_types";
import { DungeonFormData } from "../DungeonEditor";

type Props = {
  initialData?: DungeonResponse;
  isAdmin: boolean;
  user: { id: string; role?: string; [key: string]: any };
  tiles: TileConfigKey[][];
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

  // 共通マップデータを組み立てる軽量ヘルパー
  function getCommonMapData() {
    return {
      tiles: tiles,
      entities: entities,
      width: cols,
      height: rows,
    };
  }

  /**
   * 下書き保存
   */
  const onDraftSubmit = async (data: DungeonFormData) => {
    try {
      const { mapDataCheck, ...rest } = data;
      let savedDungeon: DungeonResponse;

      if (isEditMode) {
        savedDungeon = await update({
          ...rest,
          mapData: getCommonMapData(),
          mapSizeHeight: rows,
          mapSizeWidth: cols,
          mapSize: cols * rows,
          difficulty: initialData?.difficulty ?? 3,
          status: "DRAFT" as const,
          tagIds: [],
          versionMajor: initialData?.versionMajor ?? 1,
          versionMinor: (initialData?.versionMinor ?? 0) + 1,
        });
      } else {
        savedDungeon = await create({
          ...rest,
          code: `DN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          userId: user.id,
          mapData: getCommonMapData(),
          mapSizeHeight: rows,
          mapSizeWidth: cols,
          mapSize: cols * rows,
          difficulty: 3,
          status: "DRAFT" as const,
          isTemplate: isAdmin || user.role === "ADMIN",
          tagIds: [],
          versionMajor: 0,
          versionMinor: 1,
          createdBy: user.id,
          updatedBy: user.id,
        });
      }

      const targetId = savedDungeon?.id || initialData?.id;

      if (targetId) {
        await mutate(`/api/dungeons/${targetId}`, savedDungeon, { revalidate: true });

        if (!isEditMode) {
          toast.success("下書きを新規保存しました");
          router.push(`/dungeons/${targetId}/edit`);
          return;
        }
      }

      toast.success("下書きを保存しました");
      reset(data);
    } catch (e) {
      toast.error("下書き保存中にエラーが発生しました");
    }
  };

  /**
   * テストプレイして公開
   */
  const onTestPlaySubmit = async (data: DungeonFormData) => {
    if (linkingState.active) return toast.error("パーツのペアを完成させてください");

    // プレイヤーとゴールの範囲内存在チェック
    let hasPlayer = false;
    let hasGoal = false;
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        const tile = tiles[r]?.[c];
        if (!tile) continue;

        const category = TILE_CONFIG[tile]?.category;
        if (category === TILE_CATEGORIES.PLAYER) hasPlayer = true;
        if (category === TILE_CATEGORIES.GOAL) hasGoal = true;
      }
    }
    if (!hasPlayer) return toast.error("プレイヤーが設置されていません");
    if (!hasGoal) return toast.error("ゴールが設置されていません");

    // 編集モード、かつ何も変更がないなら、APIへの保存をスキップして即遷移
    if (isEditMode && !isDirty) {
      router.push(`/dungeons/${initialData?.id}/test-play?v=${Date.now()}`);
      return;
    }

    try {
      const { mapDataCheck, ...rest } = data;
      let savedDungeon: DungeonResponse;

      // テストプレイ前に編集データを一旦保存
      if (isEditMode) {
        savedDungeon = await update({
          ...rest,
          mapData: getCommonMapData(),
          mapSizeHeight: rows,
          mapSizeWidth: cols,
          mapSize: cols * rows,
          difficulty: initialData?.difficulty ?? 3,
          status: "DRAFT" as const,
          tagIds: [],
          versionMinor: (initialData?.versionMinor ?? 0) + 1,
        });
      } else {
        savedDungeon = await create({
          ...rest,
          code: `DN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          userId: user.id,
          mapData: getCommonMapData(),
          mapSizeHeight: rows,
          mapSizeWidth: cols,
          mapSize: cols * rows,
          difficulty: 3,
          status: "DRAFT" as const,
          isTemplate: isAdmin || user.role === "ADMIN",
          tagIds: [],
          versionMajor: 0,
          versionMinor: 1,
          createdBy: user.id,
          updatedBy: user.id,
        });
      }

      const targetId = savedDungeon?.id || initialData?.id;

      if (targetId) {
        await mutate(`/api/dungeons/${targetId}`, savedDungeon, { revalidate: true });
        toast.success("保存に成功しました。テストプレイを開始します。");
        router.refresh();
        router.push(`/dungeons/${targetId}/test-play`);
      }
    } catch (e) {
      toast.error("保存中にエラーが発生しました");
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* 下書き保存 */}
      <button
        type="button"
        onClick={handleSubmit(onDraftSubmit)}
        disabled={(isEditMode && !isDirty) || isSaving}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed rounded-md text-xs font-bold transition-all border border-slate-700 focus:border-cyan-500 outline-none text-slate-200 shrink-0 enabled:active:scale-95"
        title="下書きを保存します"
      >
        <Save size={16} />
        {isSaving && "保存中..."}
      </button>

      {/* テストプレイして公開 */}
      <button
        type="button"
        onClick={handleSubmit(onTestPlaySubmit)}
        className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 rounded-md text-xs font-black shadow-lg shadow-cyan-500/10 border border-transparent focus:border-white/40 outline-none transition-all text-slate-950 active:scale-95 shrink-0"
      >
        <Play size={12} fill="currentColor" />
        {status === "DRAFT" || isDirty ? "テストプレイして公開" : "テストプレイ"}
      </button>
    </div>
  );
};
