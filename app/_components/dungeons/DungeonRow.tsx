import { useRouter } from "next/navigation";
import { Maximize, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGetDungeons, useUpdateDungeon, useDeleteDungeon } from "@/app/_hooks";
import { useSession } from "next-auth/react";
import { DungeonResponse, DungeonsIndexResponse } from "@/types";
import { DungeonStatus } from "@prisma/client";
import { KeyedMutator } from "swr";

const STATUS_CONFIG: Record<DungeonStatus, { label: string; className: string }> = {
  DRAFT: { label: "構築中", className: "bg-indigo-900/50 text-indigo-300" },
  PRIVATE: { label: "非公開", className: "bg-red-900/50 text-red-300" },
  DELETED: { label: "削除済", className: "bg-gray-800 text-gray-400" },
  PUBLISHED: { label: "公開中", className: "bg-[#2ab3a3]/20 text-[#2ab3a3]" },
};

interface DungeonRowProps {
  dungeon: DungeonResponse;
  mutate: KeyedMutator<DungeonsIndexResponse>;
  showUserInfo?: boolean;
  isAdminMode?: boolean;
}

export function DungeonRow({ dungeon, mutate, showUserInfo, isAdminMode }: DungeonRowProps) {
  const config = STATUS_CONFIG[dungeon.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PUBLISHED;
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  if (!userId) return toast.error("セッションが切断されました。再ログインしてください。");

  const { update, isUpdating } = useUpdateDungeon(dungeon.id);
  const { remove, isDeleting } = useDeleteDungeon(dungeon.id);
  const isLoading = isUpdating || isDeleting;

  // ダンジョンステータスの切り替え
  const toggleStatus = async () => {
    const nextStatus = dungeon.status === "PUBLISHED" ? "PRIVATE" : "PUBLISHED";
    await update({
      status: nextStatus,
      updatedBy: userId,
    });
    toast.success(`ステータスを変更しました`);
    mutate();
  };

  // ダンジョンの削除処理
  const handleDelete = async () => {
    if (!confirm("このダンジョンを削除してもよろしいですか？")) return;
    try {
      if (isAdminMode) {
        // 管理者は物理削除
        remove();
      } else {
        // 一般ユーザーは論理削除
        await update({
          status: "DELETED",
          code: `DEL-${dungeon.code}`,
          deletedFlg: true,
          updatedBy: userId,
        });
      }
      toast.success("ダンジョンを削除しました");
      mutate();
    } catch (e) {
      toast.error("削除に失敗しました");
    }
  };

  return (
    <div
      key={dungeon.id}
      className={`flex items-center gap-6 bg-[#0f111a] p-4 rounded-xl border border-gray-800 ${
        isLoading ? "opacity-50 pointer-events-none bg-gray-900" : "bg-[#0f111a] hover:bg-[#161b2e]"
      }`}
    >
      {/* 更新中のインジケーター */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="animate-spin text-[#4fd1d1]" size={24} />
        </div>
      )}
      {/* ステータスバッジ */}
      <span className={`w-24 text-center py-1 rounded-md text-xs font-bold ${config.className}`}>{config.label}</span>

      {/* ユーザー情報の表示 (管理者のダンジョン一覧画面からユーザータブの時だけ表示) */}
      {showUserInfo && (
        <div className="flex items-center gap-3 w-48 shrink-0 border-l border-gray-700 pl-4">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
            {dungeon.nickName?.[0] || "U"}
          </div>
          <span className="text-sm text-gray-300 truncate">{dungeon.userName}</span>
          <span className="text-sm text-gray-300 truncate">{dungeon.nickName}</span>
        </div>
      )}

      <span className="text-gray-400 font-mono text-sm w-24">{dungeon.code}</span>
      <span className="flex-1 font-bold text-white truncate">{dungeon.name}</span>

      {/* サイズ & 時間 */}
      <div className="flex items-center gap-4 text-gray-400 text-sm w-48">
        <span className="flex items-center gap-1">
          <Maximize size={16} /> {dungeon.mapSizeHeight}x{dungeon.mapSizeWidth}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={16} /> {dungeon.timeLimit} sec
        </span>
      </div>

      {/* 操作ボタン群 */}
      <div className="flex items-center gap-2">
        {showUserInfo /* ユーザータブ表示中：詳細ボタンのみ */ ? (
          <button
            onClick={() => router.push(`/admin/dungeons/user/${dungeon.id}`)}
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-1.5 rounded text-xs font-bold transition-all"
          >
            詳細
          </button>
        ) : (
          <>
            <button
              disabled={isLoading || dungeon.status === "DRAFT"}
              onClick={() => toggleStatus()}
              className={`w-28 py-1.5 rounded text-sm font-bold transition-colors ${
                dungeon.status === "DRAFT"
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-[#4a6cf7] hover:bg-[#3b5bdb] text-white"
              }`}
            >
              {dungeon.status === "DRAFT" ? "公開不可" : dungeon.status === "PRIVATE" ? "公開する" : "非公開にする"}
            </button>
            <button
              onClick={() => router.push(`/dungeons/${dungeon.id}/edit`)}
              disabled={isLoading}
              className="bg-red-900/80 hover:bg-red-800 text-white px-4 py-1.5 rounded text-sm font-bold"
            >
              編集
            </button>
            <button
              onClick={() => handleDelete()}
              className="bg-[#00c2cb] hover:bg-[#00a8af] text-white px-4 py-1.5 rounded text-sm font-bold"
            >
              削除
            </button>
          </>
        )}
      </div>
    </div>
  );
}
