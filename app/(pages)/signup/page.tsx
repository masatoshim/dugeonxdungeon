"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Suspense } from "react";

// バリデーションスキーマの定義
const signupSchema = z.object({
  userName: z.string().min(3, "ユーザー名は3文字以上で入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上必要です"),
});

type SignupSchema = z.infer<typeof signupSchema>;

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-mono">
          LOADING...
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard/profile";
  const authError = searchParams.get("error");

  useEffect(() => {
    if (authError === "AlreadyRegisteredWithPassword" || authError === "OAuthAccountNotLinked") {
      toast.error("このメールアドレスは既にパスワードで登録されています。ログイン画面からログインしてください。", {
        duration: 6000,
      });
    } else if (authError) {
      toast.error("認証中にエラーが発生しました。");
    }
  }, [authError]);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
  });

  // ID/パスワードによる登録処理
  const onSubmit = async (data: SignupSchema) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 201) {
        // 登録成功後の遷移先にもcallbackUrlを含める→認証メール確認後に戻ってこれるようにするため
        const verifyUrl = `/signup/verify-request?email=${encodeURIComponent(data.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
        // 登録成功、確認待ち画面へ
        router.push(verifyUrl);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || errorData.error || "登録に失敗しました");
        setLoading(false);
      }
    } catch (error) {
      toast.error("通信エラーが発生しました");
      setLoading(false);
    }
  };

  // Google認証による登録・ログイン処理
  const handleGoogleSignup = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="max-w-[400px] mx-auto my-10 p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-8 text-center tracking-tight">新規登録</h1>

      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* ユーザー名 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300 ml-1">ユーザー名</label>
          <input
            {...register("userName")}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4fd1d1]/50 focus:border-[#4fd1d1] transition-all"
            placeholder="冒険者の名前"
          />
          {errors.userName && (
            <span className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.userName.message}</span>
          )}
        </div>

        {/* メールアドレス */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300 ml-1">メールアドレス</label>
          <input
            type="email"
            {...register("email")}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4fd1d1]/50 focus:border-[#4fd1d1] transition-all"
            placeholder="email@example.com"
          />
          {errors.email && <span className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.email.message}</span>}
        </div>

        {/* パスワード */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300 ml-1">パスワード</label>
          <input
            type="password"
            {...register("password")}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4fd1d1]/50 focus:border-[#4fd1d1] transition-all"
            placeholder="8文字以上のパスワード"
          />
          {errors.password && (
            <span className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-[#4fd1d1] hover:bg-[#3dbdbd] disabled:bg-slate-700 text-slate-950 font-bold py-3 rounded-lg transition-colors cursor-pointer"
        >
          {loading ? "登録中..." : "新規登録"}
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

      {/* Google連携ボタン */}
      <button
        onClick={handleGoogleSignup}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-lg transition-colors cursor-pointer shadow-md"
      >
        <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
        Googleで新規登録
      </button>

      <div className="mt-8 text-center flex flex-col gap-2">
        <p className="text-slate-400 text-sm">既にアカウントをお持ちですか？</p>
        <button
          className="text-[#4fd1d1] text-sm font-bold hover:underline cursor-pointer"
          onClick={() => {
            // ログイン画面に戻る際もcallbackUrlを維持
            router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
          }}
        >
          ログイン画面へ
        </button>
      </div>
    </div>
  );
}
