"use client";

import { Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">読み込み中...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータの取得
  const verified = searchParams.get("verified");
  const initialEmail = searchParams.get("email") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 認証完了後のメッセージ表示
  useEffect(() => {
    if (verified === "true") {
      toast.success("メール認証が完了しました！ログインしてください。", {
        duration: 5000,
      });
    }
  }, [verified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl,
    });

    if (result?.error) {
      toast.error("ログインに失敗しました。メールアドレスまたはパスワードを確認してください。");
      setIsSubmitting(false);
    } else {
      toast.success("ログインしました！");

      // 最新のセッション情報を取得してロールを確認
      const session = await getSession();

      // デフォルトの遷移先（callbackUrlが "/" や指定なしの場合）
      if (callbackUrl === "/" || !callbackUrl) {
        if (session?.user?.role === "ADMIN") {
          router.push("/admin/dashboard/home");
        } else {
          router.push("/dashboard/profile");
        }
      } else {
        router.push(callbackUrl);
      }

      router.refresh();
    }
  };

  const handleGoogleSubmit = () => {
    // 中間ページへ飛ばす。元のcallbackUrlがある場合はクエリパラメータで引き継ぐ
    const dest = `/login/callback?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    signIn("google", { callbackUrl: dest });
  };

  return (
    <div className="flex flex-col items-center justify-start sm:justify-center min-h-screen bg-white p-4 py-8 sm:py-4 text-slate-900">
      <div className="w-full max-w-[400px] bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-slate-100 my-auto">
        <h1 className="text-2xl font-bold text-white mb-8 text-center tracking-tight">ログイン</h1>

        {/* 認証完了バナー */}
        {verified === "true" && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg text-center animate-pulse font-medium">
            メール確認が取れました
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* メールアドレス */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">メールアドレス</label>
            <input
              type="email"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4fd1d1]/50 focus:border-[#4fd1d1] transition-all text-sm"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* パスワード */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">パスワード</label>
            <input
              type="password"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4fd1d1]/50 focus:border-[#4fd1d1] transition-all text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <div className="flex justify-end mt-1 mr-1">
              <Link href="/login/forgot-password" className="text-xs text-[#4fd1d1] hover:underline">
                パスワードをお忘れですか？
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full bg-[#4fd1d1] hover:bg-[#3dbdbd] disabled:bg-slate-700 text-slate-950 font-bold py-3 rounded-lg transition-colors cursor-pointer text-sm"
          >
            {isSubmitting ? "認証中..." : "ログイン"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-800"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-500 font-mono">OR</span>
          </div>
        </div>

        {/* Googleログインボタン */}
        <button
          onClick={handleGoogleSubmit}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-lg transition-colors cursor-pointer shadow-md text-sm"
        >
          <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
          Googleでログイン
        </button>

        {/* フッターリンク */}
        <div className="mt-8 text-center flex flex-col gap-4 border-t border-slate-800/80 pt-6 text-sm">
          {/* 新規登録 */}
          <div className="flex flex-col gap-1.5">
            <p className="text-slate-400 text-xs">アカウントをお持ちでない方</p>
            <Link
              href={`/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="text-[#4fd1d1] text-xs font-bold hover:underline"
            >
              新規登録はこちら
            </Link>
          </div>

          {/* 確認メール再送への導線 */}
          <div className="pt-2">
            <Link
              href="/login/resend"
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-4"
            >
              確認メールが届いていない方はこちら
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
