"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // セキュリティ上の理由から、成功・失敗に関わらず完了扱いにする
      setIsSubmitted(true);
      toast.success("パスワード再設定用のメールを送信しました。");
    } catch (err) {
      console.error(err);
      toast.error("エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-slate-900">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-2">パスワードをお忘れですか？</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          登録したメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
        </p>

        {!isSubmitted ? (
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
              {isSubmitting ? "送信中..." : "再設定メールを送信"}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-md">
              メールを送信しました。
              <br />
              記載された手順に従ってパスワードの再設定を行ってください。
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
