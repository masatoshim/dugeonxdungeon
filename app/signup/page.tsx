"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// バリデーションスキーマの定義
const signupSchema = z.object({
  userName: z.string().min(3, "ユーザー名は3文字以上で入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上必要です"),
});

type SignupSchema = z.infer<typeof signupSchema>;

export default function SignupPage() {
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
        // 登録成功、確認待ち画面へ
        router.push(`/signup/verify-request?email=${encodeURIComponent(data.email)}`);
      } else if (res.status === 429) {
        // 制限エラーの時は、エラーメッセージをトースト等で表示
        toast.error("現在、送信制限中です。サポートへご連絡ください。");
      }
    } catch (error) {
      toast.error("通信エラーが発生しました");
    }
  };

  // Googleによる登録・ログイン処理
  const handleGoogleSignup = () => {
    signIn("google", { callbackUrl: "/" }); // todo: dashboardに遷移するよう変更する
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px" }}>
      <h1>新規登録</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* ユーザー名 */}
        <div>
          <label>ユーザー名</label>
          <input {...register("userName")} style={{ width: "100%", display: "block" }} />
          {errors.userName && <span style={{ color: "red", fontSize: "12px" }}>{errors.userName.message}</span>}
        </div>

        {/* メールアドレス */}
        <div>
          <label>メールアドレス</label>
          <input type="email" {...register("email")} style={{ width: "100%", display: "block" }} />
          {errors.email && <span style={{ color: "red", fontSize: "12px" }}>{errors.email.message}</span>}
        </div>

        {/* パスワード */}
        <div>
          <label>パスワード</label>
          <input type="password" {...register("password")} style={{ width: "100%", display: "block" }} />
          {errors.password && <span style={{ color: "red", fontSize: "12px" }}>{errors.password.message}</span>}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "登録中..." : "新規登録"}
        </button>
      </form>

      <hr style={{ margin: "24px 0" }} />

      {/* Google連携ボタン */}
      <button
        onClick={handleGoogleSignup}
        style={{ width: "100%", padding: "10px", backgroundColor: "#fff", border: "1px solid #ccc", cursor: "pointer" }}
      >
        Googleで新規登録
      </button>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>既にアカウントをお持ちですか？</p>
        <button onClick={() => router.push("/login")}>ログイン画面へ</button>
      </div>
    </div>
  );
}
