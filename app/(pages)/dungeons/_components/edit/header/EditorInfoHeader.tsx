"use client";

import { useState, useRef } from "react";
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
    setValue,
    formState: { errors },
  } = useFormContext<DungeonFormData>();
  const config = watch();

  // スワイプ検知用の座標保持用 ref
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.PointerEvent) => {
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    touchStartY.current = clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent | React.PointerEvent) => {
    if (touchStartY.current === null) return;
    const clientY = "changedTouches" in e ? e.changedTouches[0].clientY : e.clientY;
    const diffY = clientY - touchStartY.current;

    // 縦方向の移動量が30px以上の場合にスワイプと判定
    if (Math.abs(diffY) > 30) {
      if (diffY < 0) {
        // 上方向へのスワイプ → 折りたたむ
        setIsOpen(false);
      } else {
        // 下方向へのスワイプ → 展開する
        setIsOpen(true);
      }
    }
    touchStartY.current = null;
  };

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
      {/* 1段目：メインヘッダーエリア */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between w-full select-none pb-1 group/header gap-y-2 gap-x-2">
        {/* 左側：ナビゲーション・メタ情報 ＋ エラーバッジ */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          <div className="w-fit shrink-0" onClick={(e) => e.stopPropagation()}>
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

          {/* 折りたたみ時のみ表示されるダンジョン名 */}
          {!isOpen && (
            <span
              className="text-xs font-bold text-slate-300 truncate max-w-[140px] sm:max-w-[240px] md:max-w-[320px] shrink-0"
              title={config.name}
            >
              {config.name}
            </span>
          )}

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <DeleteActionGroup initialData={initialData} isAdmin={isAdmin} />
          </div>

          {errors.name && (
            <span className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded font-black animate-pulse shrink-0 whitespace-nowrap">
              {errors.name.message}
            </span>
          )}
          {errors.description && (
            <span className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded font-black animate-pulse shrink-0 whitespace-nowrap">
              {errors.description.message}
            </span>
          )}
          {errors.timeLimit && (
            <span className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded font-black animate-pulse shrink-0 whitespace-nowrap">
              {errors.timeLimit.message}
            </span>
          )}
        </div>

        {/* 右側：各種操作アクション */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto md:ml-0">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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

          {/* 折り畳みボタン */}
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
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
        <div className="flex flex-col gap-2 w-full animate-[fadeIn_0.15s_ease-out] border-b border-slate-800/40 pb-1.5">
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-2.5 w-full pt-0.5">
            {/* ダンジョン名入力 */}
            <div className="flex items-center gap-2.5 bg-slate-950/40 px-3.5 py-1.5 rounded-xl border border-slate-800/80 flex-1 min-w-0 transition-all duration-200 focus-within:border-cyan-500/80 focus-within:bg-slate-900/60 focus-within:shadow-lg focus-within:shadow-cyan-500/5 group/name">
              <label className="flex items-center gap-1 text-[11px] font-sans font-black tracking-wider text-slate-400 shrink-0 select-none uppercase">
                ダンジョン名:
              </label>
              <input
                type="text"
                placeholder="未設定のダンジョン"
                className={`bg-transparent text-sm font-bold p-0 border-none outline-none focus:outline-none focus:ring-0 w-full transition-colors ${errors.name ? "text-red-200 placeholder-red-400/50" : "text-slate-100 placeholder-slate-600"}`}
                {...register("name", { onBlur: onConfigConfirm })}
              />
            </div>

            {/* サイズ ＆ 制限時間 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-sm text-slate-400 shrink-0 select-none w-full lg:w-auto">
              {/* サイズ */}
              <div className="flex items-center justify-between sm:justify-start gap-2.5 bg-slate-950/40 px-3.5 py-1.5 rounded-xl border border-slate-800/80 flex-1 sm:flex-initial h-full transition-all duration-200 focus-within:border-cyan-500/80 focus-within:bg-slate-900/60 focus-within:shadow-lg focus-within:shadow-cyan-500/5 group/size min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Settings
                    size={18}
                    className="text-slate-500 group-focus-within/size:text-cyan-400 transition-colors shrink-0"
                  />
                  <span className="font-black text-[11px] text-slate-400 group-focus-within/size:text-slate-300 transition-colors tracking-wider uppercase leading-none">
                    サイズ:
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-slate-200 h-full shrink-0">
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
              <div className="flex items-center justify-between sm:justify-start gap-2.5 bg-slate-950/40 px-3.5 py-1.5 rounded-xl border border-slate-800/80 flex-1 sm:flex-initial h-full transition-all duration-200 focus-within:border-cyan-500/80 focus-within:bg-slate-900/60 focus-within:shadow-lg focus-within:shadow-cyan-500/5 group/time min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Clock
                    size={18}
                    className="text-slate-500 group-focus-within/time:text-cyan-400 transition-colors shrink-0"
                  />
                  <span className="font-black text-[11px] text-slate-400 group-focus-within/time:text-slate-300 transition-colors tracking-wider uppercase leading-none">
                    制限時間:
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    defaultValue={config.timeLimit}
                    key={config.timeLimit}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      const isSpinButton = (e.nativeEvent as any).inputType === undefined;
                      if (isSpinButton && newValue !== "") {
                        const num = Number(newValue);
                        setValue("timeLimit", num, { shouldValidate: true });
                        onConfigConfirm();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        setTimeout(() => {
                          const num = Number((e.target as HTMLInputElement).value);
                          if (!isNaN(num)) {
                            setValue("timeLimit", num, { shouldValidate: true });
                            onConfigConfirm();
                          }
                        }, 0);
                      } else if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    onBlur={(e) => {
                      const num = Number(e.target.value);
                      if (!isNaN(num)) {
                        setValue("timeLimit", num, { shouldValidate: true });
                      }
                      onConfigConfirm();
                    }}
                    className="bg-slate-800 border border-slate-700 focus:border-cyan-500 focus:bg-slate-700/50 rounded px-2 py-0 text-center font-mono font-bold text-slate-100 w-18 h-6 outline-none focus:ring-0 transition-all text-sm m-0"
                  />

                  <span className="text-slate-500 font-mono text-xs leading-none">sec</span>
                </div>
              </div>
            </div>
          </div>

          {/* 説明文 */}
          <div className="flex items-center gap-2 bg-slate-950/20 px-3.5 py-1 rounded-xl border border-slate-800/40 w-full transition-all duration-200 focus-within:border-cyan-500/80 focus-within:bg-slate-900/40 focus-within:shadow-lg focus-within:shadow-cyan-500/5 group/desc">
            <FileText
              size={13}
              className="text-slate-500 shrink-0 group-focus-within/desc:text-cyan-400 transition-colors"
            />
            <input
              type="text"
              placeholder="ダンジョンの説明文やキャッチコピーを追加..."
              className="bg-transparent text-slate-300 outline-none w-full text-xs placeholder-slate-600 py-0.5 focus:ring-0 focus:outline-none min-w-0"
              {...register("description", { onBlur: onConfigConfirm })}
            />
          </div>
        </div>
      )}

      {/* トグルバー（画面幅が狭いときのみ表示） */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handleTouchStart}
        onPointerUp={handleTouchEnd}
        className="flex md:hidden w-full h-5 bg-slate-900/40 hover:bg-slate-800/80 active:bg-slate-800 items-center justify-center cursor-pointer transition-colors group/bar select-none relative"
        title={isOpen ? "折りたたむ" : "展開する"}
      >
        <div className="w-10 h-3 bg-slate-600 group-hover/bar:bg-cyan-400 rounded-full transition-colors flex items-center justify-center"></div>
        <ChevronDown
          size={15}
          className={`absolute text-slate-500 group-hover/bar:text-slate-300 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
        />
      </div>
    </div>
  );
};
