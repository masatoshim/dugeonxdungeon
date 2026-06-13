import { FieldErrors } from "react-hook-form";
import { DungeonStatus } from "@prisma/client";
import { Clock, FileText, Settings } from "lucide-react";
import { EditorSizeInput } from "@/app/(pages)/dungeons/_components";

type Props = {
  status: DungeonStatus;
  config: {
    name: string;
    description: string;
    timeLimit: number;
  };
  cols: number;
  rows: number;
  errors: FieldErrors;
  onConfigChange: (key: string, value: string | number, shouldDirty: boolean) => void;
  onSizeChange: (r: number, c: number) => void;
};

export const EditorInfoForm = ({ status, config, cols, rows, errors, onConfigChange, onSizeChange }: Props) => {
  const statusStyles =
    {
      DRAFT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      PRIVATE: "bg-slate-500/10 text-slate-400 border-slate-500/30",
      PUBLISHED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      DELETED: "bg-red-500/10 text-red-400 border-red-500/30",
    }[status] || "bg-slate-500/10 text-slate-400 border-slate-500/30";

  return (
    // 🛠️ 改善：最外枠に最大幅「max-w-3xl (約768px)」または「max-w-4xl」を指定。
    // これにより、上段と下段の全体の横幅がこれ以上広がらなくなり、右側のアクションバーとの間に綺麗な余白が生まれます。
    <div className="flex flex-col gap-3 max-w-3xl w-full">
      {/* ─── 上段：ダンジョン名(ステータス内包) ＋ サイズ ＋ 制限時間 ─── */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
        {/* ダンジョン名とステータスのグループ */}
        {/* 🛠️ 改善：親の max-w に任せるため、個別の max-w-xs は削除して flex-1（または w-full の自動計算）にします */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          {/* エラーメッセージ */}
          {errors.name && <span className="text-[10px] text-red-400 font-bold animate-pulse">※名前は必須です</span>}
          <div className="flex items-baseline gap-2 border-b-2 border-slate-800 hover:border-slate-600 focus-within:border-cyan-500/90 transition-all duration-200 pb-1 w-full">
            <span
              className={`text-[13px] px-2 py-0.5 rounded border font-black uppercase tracking-wider shrink-0 select-none transform -translate-y-[1px] ${statusStyles}`}
            >
              {status === "DRAFT"
                ? "構築中"
                : status === "PRIVATE"
                  ? "非公開"
                  : status === "PUBLISHED"
                    ? "公開中"
                    : "削除済み"}
            </span>
            <input
              type="text"
              value={config.name}
              placeholder="ダンジョン名を入力..."
              onChange={(e) => onConfigChange("name", e.target.value, false)}
              className={`bg-transparent text-base font-black p-0 border-none outline-none focus:outline-none focus:ring-0 w-full transition-colors ${errors.name ? "text-red-200 placeholder-red-400/50" : "text-white placeholder-slate-600"}`}
            />
          </div>
        </div>

        {/* サイズ ＆ 制限時間 */}
        <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0 md:mb-0.5 md:ml-2">
          {/* サイズ */}
          <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/80 shrink-0 transition-all duration-200 focus-within:border-cyan-500/80 focus-within:bg-slate-900/60 focus-within:shadow-lg focus-within:shadow-cyan-500/5 group/size">
            <Settings size={14} className="text-slate-500 group-focus-within/size:text-cyan-400 transition-colors" />
            <span className="font-medium group-focus-within/size:text-slate-300 transition-colors">サイズ:</span>
            <div className="flex items-center gap-1.5 font-mono text-slate-200">
              <EditorSizeInput label="縦" initialValue={rows} onConfirm={(newRows) => onSizeChange(newRows, cols)} />
              <span className="text-slate-600 font-bold select-none">×</span>
              <EditorSizeInput label="横" initialValue={cols} onConfirm={(newCols) => onSizeChange(rows, newCols)} />
            </div>
          </div>

          {/* 制限時間 */}
          <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/80 shrink-0 transition-all duration-200 focus-within:border-cyan-500/80 focus-within:bg-slate-900/60 focus-within:shadow-lg focus-within:shadow-cyan-500/5 group/time">
            <Clock size={14} className="text-slate-500 group-focus-within/time:text-cyan-400 transition-colors" />
            <span className="font-medium text-slate-400 group-focus-within/time:text-slate-300 transition-colors">
              制限時間:
            </span>
            <input
              type="number"
              value={config.timeLimit}
              onChange={(e) => onConfigChange("timeLimit", parseInt(e.target.value) || 0, true)}
              className="bg-slate-800 border border-slate-700 focus:border-cyan-500 focus:bg-slate-700/50 rounded px-2 py-0.5 text-center font-mono font-bold text-slate-200 w-14 outline-none focus:ring-0 transition-all"
            />
            <span className="text-slate-500 font-mono">sec</span>
          </div>
        </div>
      </div>

      {/* ─── 下段：説明文 ─── */}
      {/* 🛠️ 最外枠が max-w-3xl に固定されたため、w-full を指定するだけで上段の右端とピッタリ同じ位置で綺麗に止まります */}
      <div className="flex items-center gap-2 bg-slate-950/20 px-3 py-1.5 rounded-lg border border-slate-800/40 w-full transition-all duration-200 focus-within:border-cyan-500/80 focus-within:bg-slate-900/40 focus-within:shadow-lg focus-within:shadow-cyan-500/5 group/desc">
        <FileText
          size={14}
          className="text-slate-500 shrink-0 group-focus-within/desc:text-cyan-400 transition-colors"
        />
        <input
          type="text"
          value={config.description}
          placeholder="ダンジョンの説明文やキャッチコピーを追加..."
          onChange={(e) => onConfigChange("description", e.target.value, false)}
          className="bg-transparent text-slate-300 outline-none w-full text-xs placeholder-slate-600 py-0.5 focus:ring-0 focus:outline-none"
        />
      </div>
    </div>
  );
};
