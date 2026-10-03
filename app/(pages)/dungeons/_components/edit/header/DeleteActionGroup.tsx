import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

  // サーバーサイドレンダリング時のエラーを防ぐためのマウント判定
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 削除の種類（通常削除: "soft" / 完全削除: "physical"）を保持
  const [deleteTarget, setDeleteTarget] = useState<"soft" | "physical" | null>(null);

  if (!isEditMode) return null;

  const handleDeleteClick = (type: "soft" | "physical") => {
    if (type === "physical" && !isAdmin) {
      toast.error("削除処理が実行できません");
      return;
    }
    setDeleteTarget(type);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget === "physical") {
      await remove();
      router.push("/admin/dashboard/dungeons");
    } else if (deleteTarget === "soft") {
      await update({
        status: "DELETED" as const,
        deletedFlg: true,
      });
      router.push(isAdmin ? "/admin/dashboard/dungeons" : "/dashboard/dungeons");
    }
    setDeleteTarget(null);
  };

  // モーダルの中身
  const modalContent = deleteTarget !== null && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">
          {deleteTarget === "physical" ? "完全削除の確認" : "ダンジョンの削除"}
        </h3>
        <p className="text-sm text-slate-300">
          {deleteTarget === "physical"
            ? "管理者権限：物理削除を実行します。復元できませんがよろしいですか？"
            : "このダンジョンを削除しますか？"}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors shadow-lg shadow-red-900/30 disabled:opacity-50"
          >
            {isDeleting ? "処理中..." : "削除する"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => handleDeleteClick("soft")}
        disabled={isDeleting}
        className="p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-950/30 border border-slate-800/60 hover:border-red-500/30 focus:border-red-500/50 rounded-md transition-all outline-none disabled:opacity-20"
        title="ダンジョンを削除します"
      >
        <Trash2 size={16} />
      </button>
      {isAdmin && (
        <button
          type="button"
          onClick={() => handleDeleteClick("physical")}
          disabled={isDeleting}
          className="px-2 py-1 bg-red-600/20 hover:bg-red-600 focus:bg-red-600 text-red-400 hover:text-white rounded-md text-xs font-bold border border-red-600/30 focus:border-red-500 outline-none transition-all disabled:opacity-20 shrink-0"
        >
          完全削除
        </button>
      )}

      {/* 削除確認カスタムモーダル（Portalでbody直下に飛ばす） */}
      {mounted && deleteTarget !== null && createPortal(modalContent, document.body)}
    </div>
  );
};
