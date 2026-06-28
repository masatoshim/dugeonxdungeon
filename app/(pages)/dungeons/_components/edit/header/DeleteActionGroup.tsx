import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUpdateDungeon, useDeleteDungeon } from "@/app/_hooks";
import { DungeonResponse } from "@/app/_types";
import { toast } from "sonner";

type Props = {
  initialData?: DungeonResponse;
  isAdmin: boolean;
};

export const DeleteActionGroup = ({ initialData, isAdmin }: Props) => {
  const router = useRouter();
  const isEditMode = !!initialData?.id;
  const { update } = useUpdateDungeon(initialData?.id || "");
  const { remove, isDeleting } = useDeleteDungeon(initialData?.id || "");

  if (!isEditMode) return null;

  const handleOnDeleteClick = async (physical: boolean) => {
    if (physical) {
      if (window.confirm("管理者権限：物理削除を実行します。復元できませんがよろしいですか？")) {
        if (!isAdmin) return toast.error("削除処理が実行できません");
        await remove();
        router.push("/admin/dashboard/dungeons");
      }
    } else {
      if (window.confirm("このダンジョンを削除しますか？")) {
        await update({
          status: "DELETED" as const,
          deletedFlg: true,
        });
        router.push(isAdmin ? "/admin/dashboard/dungeons" : "/dashboard/dungeons");
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => handleOnDeleteClick(false)}
        disabled={isDeleting}
        className="p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-950/30 border border-slate-800/60 hover:border-red-500/30 focus:border-red-500/50 rounded-md transition-all outline-none disabled:opacity-20"
        title="ダンジョンを削除します"
      >
        <Trash2 size={16} />
      </button>
      {isAdmin && (
        <button
          type="button"
          onClick={() => handleOnDeleteClick(true)}
          disabled={isDeleting}
          className="px-2 py-1 bg-red-600/20 hover:bg-red-600 focus:bg-red-600 text-red-400 hover:text-white rounded-md text-xs font-bold border border-red-600/30 focus:border-red-500 outline-none transition-all disabled:opacity-20 shrink-0"
        >
          完全削除
        </button>
      )}
    </div>
  );
};
