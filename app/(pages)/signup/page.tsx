"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

// バリデーションスキーマの定義
const passwordSchema = z
  .string()
  .min(8, "8文字以上で入力してください")
  .max(100)
  .regex(/[a-z]/, "小文字を含めてください")
  .regex(/[A-Z]/, "大文字を含めてください")
  .regex(/[0-9]/, "数字を含めてください");

const signupSchema = z
  .object({
    userName: z.string().min(3, "ユーザー名は3文字以上で入力してください"),
    email: z.string().email("有効なメールアドレスを入力してください"),
    password: passwordSchema,
    confirmPassword: z.string(),
    agreeTerms: z.literal(true, "利用規約およびプライバシーポリシーへの同意が必要です"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type SignupSchema = z.infer<typeof signupSchema>;

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-mono">
          読み込み中...
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

  // パスワードの表示・非表示切り替え用
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      agreeTerms: false as any,
    },
  });

  // ID/パスワードによる登録処理
  const onSubmit = async (data: SignupSchema) => {
    setLoading(true);

    const { confirmPassword, agreeTerms, ...submitData } = data;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
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

  // Google連携による登録・ログイン処理
  const handleGoogleSignup = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="flex flex-col items-center justify-start sm:justify-center min-h-screen bg-white p-4 py-8 sm:py-4">
      <div className="w-full max-w-[400px] mx-auto my-auto p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-8 text-center tracking-tight">新規登録</h1>

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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#4fd1d1]/50 focus:border-[#4fd1d1] transition-all"
                placeholder="8文字以上のパスワード"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.password.message}</span>
            )}
          </div>

          {/* パスワード（確認用） */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">パスワード（確認用）</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#4fd1d1]/50 focus:border-[#4fd1d1] transition-all"
                placeholder="もう一度パスワードを入力"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-red-400 text-xs mt-1 ml-1 font-medium">{errors.confirmPassword.message}</span>
            )}
          </div>

          {/* 利用規約・プライバシーポリシー同意チェックボックス */}
          <div className="flex flex-col gap-1 mt-1">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                {...register("agreeTerms")}
                className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-950 text-[#4fd1d1] focus:ring-[#4fd1d1] focus:ring-offset-slate-900 cursor-pointer shrink-0"
              />
              <span className="text-xs text-slate-300 leading-relaxed group-hover:text-slate-200 transition-colors">
                <Link href="/terms" target="_blank" className="text-[#4fd1d1] underline hover:text-[#3dbdbd]">
                  利用規約
                </Link>
                および
                <Link href="/privacy" target="_blank" className="text-[#4fd1d1] underline hover:text-[#3dbdbd]">
                  プライバシーポリシー
                </Link>
                に同意する <span className="text-red-400">*</span>
              </span>
            </label>
            {errors.agreeTerms && (
              <span className="text-red-400 text-xs mt-0.5 ml-6 font-medium">{errors.agreeTerms.message}</span>
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
    </div>
  );
}
