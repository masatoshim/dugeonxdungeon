"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">読み込み中...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("パスワードが一致しません。");
      return;
    }

    // APIのバリデーションルールに合わせたチェック
    if (password.length < 8) {
      toast.error("パスワードは8文字以上で入力してください。");
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast.error("パスワードには小文字を含めてください。");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("パスワードには大文字を含めてください。");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("パスワードには数字を含めてください。");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "パスワードの再設定に失敗しました。");
      }

      setIsCompleted(true);
      toast.success("パスワードを再設定しました！");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-slate-900">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">無効なアクセスです</h1>
          <p className="text-sm text-gray-600 mb-6">パスワード再設定用のトークンが見つかりません。</p>
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-slate-900">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-2">新しいパスワードの設定</h1>
        <p className="text-sm text-gray-600 text-center mb-2">新しいパスワードを入力してください。</p>
        <p className="text-xs text-gray-500 text-center mb-6">
          （8文字以上、大文字・小文字・数字を含める必要があります）
        </p>

        {!isCompleted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">新しいパスワード</label>
              <input
                type="password"
                className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">新しいパスワード（確認）</label>
              <input
                type="password"
                className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors"
            >
              {isSubmitting ? "更新中..." : "パスワードを更新する"}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-md">
              パスワードの再設定が完了しました。
            </div>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 text-center transition-colors"
            >
              ログイン画面へ進む
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
