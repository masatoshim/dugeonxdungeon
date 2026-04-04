import { useRouter } from "next/navigation";
import { Maximize, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGetDungeons, useUpdateDungeon } from "@/app/_hooks";
import { useSession } from "next-auth/react";
import { DungeonResponse, DungeonsIndexResponse } from "@/types";
import { KeyedMutator } from "swr";

interface DungeonRowProps {
  dungeon: DungeonResponse;
  mutate: KeyedMutator<DungeonsIndexResponse>;
}

export function DungeonRow({ dungeon, mutate }: DungeonRowProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  if (!userId) return toast.error("セッションが切断されました。再ログインしてください。");

  const { update, isUpdating } = useUpdateDungeon(dungeon.id);

  const toggleStatus = async () => {
    const nextStatus = dungeon.status === "PUBLISHED" ? "PRIVATE" : "PUBLISHED";
    await update({
      status: nextStatus,
      updatedBy: userId,
    });
    toast.success(`ステータスを変更しました`);
    mutate();
  };

  const handleDelete = async () => {
    if (!confirm("このダンジョンを削除してもよろしいですか？")) return;
    try {
      await update({
        deletedFlg: true,
        updatedBy: userId,
      });

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
        isUpdating ? "opacity-50 pointer-events-none bg-gray-900" : "bg-[#0f111a] hover:bg-[#161b2e]"
      }`}
    >
      {/* 更新中のインジケーター */}
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="animate-spin text-[#4fd1d1]" size={24} />
        </div>
      )}
      {/* ステータスバッジ */}
      <span
        className={`w-24 text-center py-1 rounded-md text-xs font-bold ${
          dungeon.status === "DRAFT"
            ? "bg-indigo-900/50 text-indigo-300"
            : dungeon.status === "PRIVATE"
              ? "bg-red-900/50 text-red-300"
              : "bg-[#2ab3a3]/20 text-[#2ab3a3]"
        }`}
      >
        {dungeon.status === "DRAFT" ? "構築中" : dungeon.status === "PRIVATE" ? "非公開" : "公開済"}
      </span>

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
        <button
          disabled={isUpdating || dungeon.status === "DRAFT"}
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
          disabled={isUpdating}
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
      </div>
    </div>
  );
}
