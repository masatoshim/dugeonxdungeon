"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={<div className="text-white p-8">読み込み中...</div>}>
      <VerifyRequestContent />
    </Suspense>
  );
}

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("メールアドレスが見つかりません。");
      return;
    }

    if (isResending) return;
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("メールの再送信に失敗しました。");
      }

      toast.success("確認メールを再送信しました。");
    } catch (err) {
      console.error(err);
      toast.error("メールの再送信に失敗しました。しばらく経ってから再度お試しください。");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 text-white">
      <div className="w-full max-w-md rounded-lg border-2 border-dashed border-slate-700 bg-slate-800 p-8 text-center shadow-xl">
        <div className="mb-6 text-6xl">✉️</div>

        <h1 className="mb-4 text-2xl font-bold tracking-tighter text-yellow-500">冒険の書を準備中...</h1>

        <p className="mb-6 text-slate-300">
          <span className="font-semibold text-white">{email || "ご登録のメールアドレス"}</span> 宛に
          確認メールを送信しました。
        </p>

        <div className="mb-8 space-y-4 text-sm text-slate-400">
          <p>メール内のリンクをクリックして、冒険を開始してください。</p>
          <p className="text-xs italic">※メールが届かない場合は、迷惑メールフォルダをご確認ください。</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/login" className="rounded bg-slate-700 px-4 py-2 transition-colors hover:bg-slate-600">
            ログイン画面へ戻る
          </Link>
          <button
            type="button"
            onClick={handleResendEmail}
            disabled={isResending}
            className="text-xs text-slate-400 hover:text-white hover:underline disabled:opacity-50"
          >
            {isResending ? "送信中..." : "メールを再送する"}
          </button>
        </div>
      </div>
    </div>
  );
}
