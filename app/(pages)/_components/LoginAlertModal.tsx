"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, LogIn, X } from "lucide-react";

type LoginAlertModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function LoginAlertModal({ isOpen, onClose }: LoginAlertModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-6 text-slate-200">
        {/* 閉じるボタン（右上） */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
          aria-label="閉じる"
        >
          <X size={20} />
        </button>

        {/* ヘッダー・演出 */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-12 h-12 rounded-full bg-[#4fd1d1]/10 border border-[#4fd1d1]/30 flex items-center justify-center text-[#4fd1d1]">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-lg font-black text-white tracking-wide">自分だけのダンジョンを創ろう！</h3>
        </div>

        {/* メッセージ本文 */}
        <p className="text-xs text-slate-400 leading-relaxed text-center">
          アカウントを作成すると、直感的なエディタを使ってオリジナルのダンジョンを自由に作成・公開できるようになります。他のプレイヤーに挑戦してもらいましょう！
        </p>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/login");
            }}
            className="w-full sm:flex-1 flex items-center justify-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] sm:text-xs font-black py-2.5 px-2 rounded-lg transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <LogIn size={14} className="shrink-0" />
            <span>ログイン / 新規登録</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg transition-colors border border-slate-700 cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
