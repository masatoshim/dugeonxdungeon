"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "メールの送信に失敗しました。");
      }

      toast.success(data.message || "確認メールを再送信しました。");
    } catch (error: any) {
      toast.error(error.message || "エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-slate-900">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-center mb-2">確認メールの再送信</h1>
          <p className="text-xs text-gray-500 text-center">
            登録したメールアドレスを入力してください。認証用のリンクを再送します。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              type="email"
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors"
          >
            {isSubmitting ? "送信中..." : "再送信する"}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            &larr; ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
