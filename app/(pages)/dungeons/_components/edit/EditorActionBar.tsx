import { EditorSizeInput } from "@/app/(pages)/dungeons/_components";
import { Save, Play, Trash2, Settings } from "lucide-react";

type Props = {
  cols: number;
  rows: number;
  isDirty: boolean;
  isEditMode: boolean;
  isAdmin: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  status: string;
  onSizeChange: (r: number, c: number) => void;
  onSave: () => void;
  onTestPlay: () => void;
  onDeleteClick: (physical: boolean) => void;
};

export const EditorActionBar = ({
  cols,
  rows,
  isDirty,
  isEditMode,
  isAdmin,
  isSaving,
  isDeleting,
  status,
  onSizeChange,
  onTestPlay,
  onSave,
  onDeleteClick,
}: Props) => {
  return (
    <div className="flex flex-col items-end justify-between gap-3 shrink-0 h-full self-stretch min-h-[76px]">
      {/* 上段：サイズインスペクター */}
      <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs text-slate-400">
        <Settings size={14} className="text-slate-500" />
        <span className="font-medium">サイズ:</span>
        <div className="flex items-center gap-1.5 font-mono text-slate-200">
          <EditorSizeInput label="R" initialValue={rows} onConfirm={(newRows) => onSizeChange(newRows, cols)} />
          <span className="text-slate-600 font-bold">×</span>
          <EditorSizeInput label="C" initialValue={cols} onConfirm={(newCols) => onSizeChange(rows, newCols)} />
        </div>
      </div>

      {/* 下段：アクションボタン群 */}
      <div className="flex items-center gap-2">
        {isEditMode && (
          <div className="flex items-center gap-1 border-r border-slate-800 pr-2 mr-1">
            <button
              type="button"
              onClick={() => onDeleteClick(false)}
              disabled={isDeleting}
              className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-20"
              title="アーカイブ削除"
            >
              <Trash2 size={15} />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onDeleteClick(true)}
                disabled={isDeleting}
                className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold border border-red-600/30 transition-all disabled:opacity-20"
              >
                完全削除
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={(isEditMode && !isDirty) || isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all border border-slate-700 text-slate-200"
        >
          <Save size={13} />
          {isSaving ? "保存中..." : "下書き保存"}
        </button>

        <button
          type="button"
          onClick={onTestPlay}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-xs font-black shadow-lg shadow-cyan-500/10 transition-all text-slate-950 active:scale-95"
        >
          <Play size={13} fill="currentColor" />
          {status === "DRAFT" || isDirty ? "テストプレイして公開" : "テストプレイ"}
        </button>
      </div>
    </div>
  );
};
