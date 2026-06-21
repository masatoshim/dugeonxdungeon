"use client";

import { Undo2, Redo2 } from "lucide-react";

type HistoryActionGroupProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export const HistoryActionGroup = ({ canUndo, canRedo, onUndo, onRedo }: HistoryActionGroupProps) => {
  return (
    <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 border border-slate-800/80 rounded-md">
      {/* Undo ボタン */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-all active:scale-95 enabled:active:scale-90"
        title="元に戻す (Ctrl+Z)"
      >
        <Undo2 size={13} />
      </button>

      {/* 区切り線 */}
      <div className="w-[1px] h-3 bg-slate-800/80" />

      {/* Redo ボタン */}
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className="flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-all active:scale-95 enabled:active:scale-90"
        title="やり直す (Ctrl+Y)"
      >
        <Redo2 size={13} />
      </button>
    </div>
  );
};
