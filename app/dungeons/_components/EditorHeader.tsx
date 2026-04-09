import { EditorSizeInput } from "@/app/dungeons/_components";
import { FieldErrors } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DungeonStatus } from "@prisma/client";

// 新規登録時は常に構築中（DRAFT）
type Props = {
  cols: number;
  rows: number;
  config: {
    name: string;
    description: string;
    timeLimit: number;
  };
  status: DungeonStatus;
  errors: FieldErrors;
  isDirty: boolean; // フォームに変更があるか
  isEditMode: boolean;
  isAdmin: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onConfigChange: (key: string, value: string | number) => void;
  onSizeChange: (r: number, c: number) => void;
  onSave: () => void; // 下書き保存実行
  onTestPlay: () => void; // テストプレイ画面へ遷移
  onDelete: (physical: boolean) => void; // 物理削除か論理削除か
};

export const EditorHeader = ({
  cols,
  rows,
  config,
  status,
  errors,
  isDirty,
  isEditMode,
  isAdmin,
  isSaving,
  isDeleting,
  onConfigChange,
  onSizeChange,
  onSave,
  onTestPlay,
  onDelete,
}: Props) => {
  const router = useRouter();

  // キャンセル時の遷移先
  const handleCancel = () => {
    if (isDirty && !confirm("変更が保存されていません。終了しますか？")) return;
    router.push(isAdmin ? "/admin/dungeons" : "/dungeons");
  };

  return (
    <div className="bg-gray-900 border-b border-gray-800 p-4 mb-6 rounded-xl shadow-2xl">
      <div className="flex flex-wrap gap-4 items-end justify-between">
        {/* 左側：基本情報入力 */}
        <div className="flex flex-wrap gap-4 flex-1">
          <span className={`w-24 text-center py-1 rounded-md text-xs font-bold `}>
            {status === "DRAFT" ? "構築中" : status === "PRIVATE" ? "非公開" : "公開中"}
          </span>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Dungeon Name</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => onConfigChange("name", e.target.value)}
              className={`bg-gray-800 border ${errors.name ? "border-red-500" : "border-gray-700"} rounded px-3 py-1.5 text-sm outline-none w-64 focus:ring-1 ring-amber-500`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Time (sec)</label>
            <input
              type="number"
              value={config.timeLimit}
              onChange={(e) => onConfigChange("timeLimit", parseInt(e.target.value) || 0)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm w-24 outline-none focus:ring-1 ring-amber-500"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Description</label>
            <input
              type="text"
              value={config.description}
              onChange={(e) => onConfigChange("description", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 ring-amber-500"
            />
          </div>
        </div>

        {/* 右側：操作・サイズ設定 */}
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            {/* ダンジョンサイズ設定 */}
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-gray-800">
              <EditorSizeInput label="R" initialValue={rows} onConfirm={(newRows) => onSizeChange(newRows, cols)} />
              <span className="text-gray-600 text-xs font-bold">×</span>
              <EditorSizeInput label="C" initialValue={cols} onConfirm={(newCols) => onSizeChange(rows, newCols)} />
            </div>

            {/* キャンセル */}
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-2 text-gray-400 hover:text-white text-xs font-bold transition-colors"
            >
              管理画面に戻る
            </button>
          </div>

          <div className="flex gap-2">
            {/* 削除ボタン（編集時のみ） */}
            {isEditMode && (
              <>
                <button
                  type="button"
                  onClick={() => confirm("このダンジョンを削除（アーカイブ）しますか？") && onDelete(false)}
                  className="px-3 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg text-xs font-bold border border-red-900/50 transition-all"
                >
                  削除
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() =>
                      confirm("管理者権限：物理削除を実行します。復元できませんがよろしいですか？") && onDelete(true)
                    }
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-900/20 transition-all"
                  >
                    完全削除
                  </button>
                )}
              </>
            )}

            {/* 保存系ボタン */}
            <button
              type="button"
              onClick={onSave}
              disabled={(isEditMode && !isDirty) || isSaving}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all"
            >
              {isSaving ? "保存中..." : "下書き保存"}
            </button>

            <button
              type="button"
              onClick={onTestPlay}
              disabled={isEditMode && !isDirty && status !== "DRAFT"}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs font-bold shadow-lg shadow-amber-900/40 transition-all text-white"
            >
              テストプレイして公開
            </button>
          </div>
        </div>
      </div>

      {/* バリデーションエラーがある場合の簡易表示 */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-2 text-[10px] text-red-400 font-bold animate-pulse">
          ※ 入力内容に不備があります：{Object.values(errors)[0]?.message as string}
        </div>
      )}
    </div>
  );
};
