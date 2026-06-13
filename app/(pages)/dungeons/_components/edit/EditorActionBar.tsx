import { Save, Play, Trash2, ArrowLeft } from "lucide-react";

type Props = {
  isDirty: boolean;
  isEditMode: boolean;
  isAdmin: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  status: string;
  onCancel: () => void;
  onSave: () => void;
  onTestPlay: () => void;
  onDeleteClick: (physical: boolean) => void;
};

export const EditorActionBar = ({
  isDirty,
  isEditMode,
  isAdmin,
  isSaving,
  isDeleting,
  status,
  onCancel,
  onTestPlay,
  onSave,
  onDeleteClick,
}: Props) => {
  return (
    // 🛠️ 改善：幅は親の 280px に任せ(w-full)、高さ(h-full)を活かして上下の端(justify-between)に配置
    <div className="flex flex-col justify-between items-end gap-4 w-full h-full lg:border-l lg:border-slate-800 lg:pl-4">
      {/* ─── 上段：右上の「管理画面に戻る」 ─── */}
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-950/20 hover:bg-slate-800 border border-slate-800 focus:border-cyan-500 rounded-lg transition-all outline-none focus:ring-1 focus:ring-cyan-500/30 shrink-0"
      >
        <ArrowLeft size={14} />
        <span>管理画面に戻る</span>
      </button>

      {/* ─── 下段：右下のアクションボタン群 ─── */}
      {/* 🛠️ 改善：flex-wrap を入れて、万が一ボタンが溢れても重ならずに綺麗に折り返すセーフティを配置 */}
      <div className="flex flex-wrap items-center justify-end gap-2 w-full">
        {isEditMode && (
          <div className="flex items-center gap-1 border-r border-slate-800 pr-2 mr-1">
            <button
              type="button"
              onClick={() => onDeleteClick(false)}
              disabled={isDeleting}
              className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-950/30 border border-transparent focus:border-red-500/50 rounded-lg transition-all outline-none disabled:opacity-20"
              title="アーカイブ削除"
            >
              <Trash2 size={15} />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onDeleteClick(true)}
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
          onClick={onSave}
          disabled={(isEditMode && !isDirty) || isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all border border-slate-700 focus:border-cyan-500 outline-none text-slate-200 shrink-0 enabled:active:scale-95"
        >
          <Save size={13} />
          {isSaving ? "保存中..." : "下書き保存"}
        </button>

        <button
          type="button"
          onClick={onTestPlay}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-xs font-black shadow-lg shadow-cyan-500/10 border border-transparent focus:border-white/40 outline-none transition-all text-slate-950 active:scale-95 shrink-0"
        >
          <Play size={13} fill="currentColor" />
          {status === "DRAFT" || isDirty ? "テストプレイして公開" : "テストプレイ"}
        </button>
      </div>
    </div>
  );
};
