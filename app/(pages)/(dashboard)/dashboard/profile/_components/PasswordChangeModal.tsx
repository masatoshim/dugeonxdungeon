"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, X, Lock } from "lucide-react";
import { useUpdateUser } from "@/app/_hooks";
import { useSession } from "next-auth/react";

export function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { update } = useUpdateUser(userId!);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // マウント時にモーダルとして開く
    dialogRef.current?.showModal();
    // 背景スクロール禁止
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "パスワードは8文字以上必要です。" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "パスワードが一致しません。" });
      return;
    }
    if (!userId) {
      setMessage({ type: "error", text: "セッションがタイムアウトしました。再ログインしてください。" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await update({ password: newPassword });
      setMessage({ type: "success", text: "パスワードを更新しました！" });
      setTimeout(onClose, 2000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "更新に失敗しました。";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="m-auto backdrop:bg-slate-950/90 p-0 bg-transparent overflow-visible focus:outline-none"
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
    >
      <div className="relative bg-[#1a1d2b] border border-[#4fd1d1]/30 rounded-2xl p-8 w-[90vw] max-w-sm shadow-[0_0_100px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200 overflow-visible">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-[#4fd1d1]/10 rounded-lg shrink-0">
            <Lock className="text-[#4fd1d1]" size={20} />
          </div>
          <h3 className="text-[#4fd1d1] font-mono tracking-tighter text-lg leading-none pr-8">パスワードを変更する</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 ml-1 font-mono">NEW_PASSWORD</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-[#4fd1d1] transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 ml-1 font-mono">CONFIRM_PASSWORD</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-[#4fd1d1] transition-all"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div
              className={`text-xs p-3 rounded-lg text-white ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors font-medium"
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-[#4fd1d1] text-[#0f111a] font-bold rounded-xl hover:bg-[#3db8b8] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "更新実行"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
