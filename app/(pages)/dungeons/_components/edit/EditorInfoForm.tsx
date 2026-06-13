import { FieldErrors } from "react-hook-form";
import { DungeonStatus } from "@prisma/client";
import { ArrowLeft, Clock, FileText } from "lucide-react";

type Props = {
  status: DungeonStatus;
  config: {
    name: string;
    description: string;
    timeLimit: number;
  };
  errors: FieldErrors;
  onConfigChange: (key: string, value: string | number, shouldDirty: boolean) => void;
  onCancel: () => void;
};

export const EditorInfoForm = ({ status, config, errors, onConfigChange, onCancel }: Props) => {
  const statusStyles =
    {
      DRAFT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      PRIVATE: "bg-slate-500/10 text-slate-400 border-slate-500/30",
      PUBLISHED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      DELETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    }[status] || "bg-slate-500/10 text-slate-400 border-slate-500/30";

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      {/* 上段：タイトルとステータス */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          title="管理画面に戻る"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-black uppercase tracking-wider ${statusStyles}`}
            >
              {status === "DRAFT" ? "構築中" : status === "PRIVATE" ? "非公開" : "公開中"}
            </span>
            {errors.name && <span className="text-[10px] text-red-400 font-bold animate-pulse">※名前は必須です</span>}
          </div>
          <input
            type="text"
            value={config.name}
            placeholder="ダンジョン名を入力..."
            onChange={(e) => onConfigChange("name", e.target.value, false)}
            className={`bg-transparent border-b ${errors.name ? "border-red-500 text-red-200" : "border-transparent hover:border-slate-700 focus:border-cyan-500"} text-base font-black outline-none py-0.5 transition-colors w-full focus:ring-0`}
          />
        </div>
      </div>

      {/* 下段：メタプロパティ（時間・説明） */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/80 shrink-0">
          <Clock size={14} className="text-slate-500" />
          <span className="font-medium text-slate-400">制限時間:</span>
          <input
            type="number"
            value={config.timeLimit}
            onChange={(e) => onConfigChange("timeLimit", parseInt(e.target.value) || 0, true)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-center font-mono font-bold text-slate-200 w-14 outline-none focus:ring-1 ring-cyan-500/50"
          />
          <span className="text-slate-500 font-mono">sec</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/20 px-3 py-1 rounded-lg border border-slate-800/40 flex-1 min-w-0">
          <FileText size={14} className="text-slate-500 shrink-0" />
          <input
            type="text"
            value={config.description}
            placeholder="ダンジョンの説明文やキャッチコピーを追加..."
            onChange={(e) => onConfigChange("description", e.target.value, false)}
            className="bg-transparent text-slate-300 outline-none w-full text-xs placeholder-slate-600 py-1"
          />
        </div>
      </div>
    </div>
  );
};
