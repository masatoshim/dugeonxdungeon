"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { DungeonStatus } from "@prisma/client";
import { Clock, FileText, Settings, ChevronDown } from "lucide-react";
import { EditorSizeInput } from "@/app/(pages)/dungeons/_components";
import { BackButton } from "./BackButton";
import { DeleteActionGroup } from "./DeleteActionGroup";
import { SaveActionGroup } from "./SaveActionGroup";
import { HistoryActionGroup } from "./HistoryActionGroup";
import { DungeonResponse } from "@/app/_types";
import { DungeonFormData } from "../DungeonEditor";
import { TileConfigKey } from "@/game-core/master";

type Props = {
  isAdmin: boolean;
  status: DungeonStatus;
  cols: number;
  rows: number;
  onSizeChange: (r: number, c: number) => void;
  onConfigConfirm: () => void;
  initialData?: DungeonResponse;
  user: { id: string; [key: string]: any };
  tiles: TileConfigKey[][];
  entities: any;
  linkingState: { active: boolean; [key: string]: any };
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export const EditorInfoHeader = ({
  isAdmin,
  status,
  cols,
  rows,
  onSizeChange,
  onConfigConfirm,
  initialData,
  user,
  tiles,
  entities,
  linkingState,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: Props) => {
  // Props経由ではなく、Contextから直接RHFの状態を取り出す
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<DungeonFormData>();
  const config = watch();

  const statusStyles =
    {
      DRAFT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      PRIVATE: "bg-slate-500/10 text-slate-400 border-slate-500/30",
      PUBLISHED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      DELETED: "bg-red-500/10 text-red-400 border-red-500/30",
    }[status] || "bg-slate-500/10 text-slate-400 border-slate-500/30";

  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col gap-0.5 flex-1 min-w-0 w-full transition-all duration-300">
      {/* ─── 1段目：ヘッダーエリア ─── */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full select-none border-b border-slate-800/40 pb-0.5 cursor-pointer group/header"
      >
        {/* 左側：ナビゲーション・メタ情報 ＋ エラーバッジ */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-fit" onClick={(e) => e.stopPropagation()}>
            <BackButton isAdmin={isAdmin} />
          </div>

          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border font-black uppercase tracking-wider shrink-0 ${statusStyles}`}
          >
            {status === "DRAFT"
              ? "構築中"
              : status === "PRIVATE"
                ? "非公開"
                : status === "PUBLISHED"
                  ? "公開中"
                  : "削除済み"}
          </span>

          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500 shrink-0 bg-slate-950/40 px-2 py-0.5 border border-slate-800/60 rounded">
            <span className="text-cyan-500/90">{config.code}</span>
          </div>

          {errors.name && (
            <span className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded font-black animate-pulse shrink-0">
              ※ダンジョン名が未入力です
            </span>
          )}
        </div>

        {/* 右側：各種操作アクション */}
        <div className="flex items-center gap-3 shrink-0 pl-4">
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <DeleteActionGroup initialData={initialData} isAdmin={isAdmin} />
            <HistoryActionGroup canUndo={canUndo} canRedo={canRedo} onUndo={onUndo} onRedo={onRedo} />
            <SaveActionGroup
              initialData={initialData}
              isAdmin={isAdmin}
              user={user}
              tiles={tiles}
              entities={entities}
              rows={rows}
              cols={cols}
              linkingState={linkingState}
            />
          </div>

          <div
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-slate-800/60 transition-colors"
            title={isOpen ? "折りたたむ" : "展開する"}
          >
            <ChevronDown
              size={15}
              className={`text-slate-500 group-hover/header:text-slate-300 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>

      {/* ─── 2段目・3段目：コンテンツエリア ─── */}
      {isOpen && (
        <div className="flex flex-col gap-2 w-full animate-[fadeIn_0.15s_ease-out]">
          <div className="flex flex-col md:flex-row md:items-stretch gap-2.5 w-full pt-1.5">
            {/* ダンジョン名入力 */}
            <div className="flex items-center gap-2.5 bg-slate-950/40 px-3.5 py-1.5 rounded-xl border border-slate-800/80 flex-1 min-w-[200px] transition-all duration-200 focus-within:border-cyan-500/80 focus-within:bg-slate-900/60 focus-within:shadow-lg focus-within:shadow-cyan-500/5 group/name">
              <label className="flex items-center gap-1 text-[11px] font-sans font-black tracking-wider text-slate-400 shrink-0 select-none uppercase">
                ダンジョン名:
              </label>
              {/* text-xs -> text-sm に変更 */}
              <input
                type="text"
                placeholder="未設定のダンジョン"
                className={`bg-transparent text-sm font-bold p-0 border-none outline-none focus:outline-none focus:ring-0 w-full transition-colors ${errors.name ? "text-red-200 placeholder-red-400/50" : "text-slate-100 placeholder-slate-600"}`}
                {...register("name", { onBlur: onConfigConfirm })}
              />
            </div>

            {/* サイズ ＆ 制限時間 */}
            <div className="flex items-center gap-2.5 text-sm text-slate-400 shrink-0 select-none">
              {/* サイズ */}
              <div className="flex items-center gap-2.5 bg-slate-950/40 px-3.5 py-1.5 rounded-xl border border-slate-800/80 shrink-0 h-full transition-all duration-200 focus-within:border-cyan-500/80 focus-within:bg-slate-900/60 focus-within:shadow-lg focus-within:shadow-cyan-500/5 group/size">
                <Settings
                  size={18}
                  className="text-slate-500 group-focus-within/size:text-cyan-400 transition-colors shrink-0"
                />
                <span className="font-black text-[11px] text-slate-400 group-focus-within/size:text-slate-300 transition-colors tracking-wider uppercase leading-none">
                  サイズ:
                </span>
                <div className="flex items-center gap-1.5 font-mono text-slate-200 h-full">
                  <EditorSizeInput
                    label="縦"
                    initialValue={rows}
                    onConfirm={(newRows) => onSizeChange(newRows, cols)}
                  />
                  <span className="text-slate-600 font-bold select-none text-xs leading-none">×</span>
                  <EditorSizeInput
                    label="横"
                    initialValue={cols}
                    onConfirm={(newCols) => onSizeChange(rows, newCols)}
                  />
                </div>
              </div>

              {/* 制限時間 */}
              <div className="flex items-center gap-2.5 bg-slate-950/40 px-3.5 py-1.5 rounded-xl border border-slate-800/80 shrink-0 h-full transition-all duration-200 focus-within:border-cyan-500/80 focus-within:bg-slate-900/60 focus-within:shadow-lg focus-within:shadow-cyan-500/5 group/time">
                <Clock
                  size={18}
                  className="text-slate-500 group-focus-within/time:text-cyan-400 transition-colors shrink-0"
                />
                <span className="font-black text-[11px] text-slate-400 group-focus-within/time:text-slate-300 transition-colors tracking-wider uppercase leading-none">
                  制限時間:
                </span>
                <input
                  type="number"
                  className="bg-slate-800 border border-slate-700 focus:border-cyan-500 focus:bg-slate-700/50 rounded px-2 py-0 text-center font-mono font-bold text-slate-100 w-14 h-6 outline-none focus:ring-0 transition-all text-sm m-0"
                  {...register("timeLimit", {
                    valueAsNumber: true,
                    onBlur: onConfigConfirm,
                  })}
                />
                <span className="text-slate-500 font-mono text-xs leading-none">sec</span>
              </div>
            </div>
          </div>

          {/* 3段目：説明文 */}
          <div className="flex items-center gap-2 bg-slate-950/20 px-3.5 py-1 rounded-xl border border-slate-800/40 w-full transition-all duration-200 focus-within:border-cyan-500/80 focus-within:bg-slate-900/40 focus-within:shadow-lg focus-within:shadow-cyan-500/5 group/desc">
            <FileText
              size={13}
              className="text-slate-500 shrink-0 group-focus-within/desc:text-cyan-400 transition-colors"
            />
            <input
              type="text"
              placeholder="ダンジョンの説明文やキャッチコピーを追加..."
              className="bg-transparent text-slate-300 outline-none w-full text-xs placeholder-slate-600 py-0.5 focus:ring-0 focus:outline-none"
              {...register("description", { onBlur: onConfigConfirm })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
