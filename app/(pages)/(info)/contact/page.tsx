"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, CheckCircle2, AlertCircle, Info } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    category: "bug",
    name: "",
    email: "",
    targetUrl: "",
    message: "",
    agreePrivacy: false,
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 二重クリックによる連続送信を完全にブロック
    if (status === "submitting") return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "送信に失敗しました");
      }

      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "送信中にエラーが発生しました。時間をおいて再度お試しください。");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* ページタイトル */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">お問い合わせ</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            DUNGEONZ×DUNGEONZ
            に関するご意見・ご要望、不具合の報告、不適切なコンテンツの通報などは以下のフォームよりご連絡ください。
          </p>
        </div>

        {/* フォームカード */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
          {status === "success" ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
              <CheckCircle2 className="mx-auto text-[#4fd1d1]" size={48} />
              <h2 className="text-xl font-bold text-white">お問い合わせを受け付けました</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                ご連絡いただきありがとうございます。確認メールをご登録のメールアドレス宛に送信いたしました。
              </p>

              {/* 迷惑メールに関する注意喚起バナー */}
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs text-left max-w-md mx-auto">
                <Info size={16} className="text-[#4fd1d1] shrink-0 mt-0.5" />
                <span>
                  自動返信メールが届かない場合は、お使いのメールサービスの
                  <strong>「迷惑メール（スパム）フォルダ」</strong>
                  に振り分けられている可能性がありますのでご確認ください。
                </span>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setFormData({
                      category: "bug",
                      name: "",
                      email: "",
                      targetUrl: "",
                      message: "",
                      agreePrivacy: false,
                    });
                  }}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  続けてお問い合わせを送信する
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === "error" && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* お問い合わせ種別 */}
              <div className="space-y-2">
                <label htmlFor="category" className="block text-xs font-bold text-slate-300">
                  お問い合わせ種別 <span className="text-red-400">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#4fd1d1] transition-colors"
                >
                  <option value="bug">不具合・バグの報告</option>
                  <option value="account">アカウント・ログインに関する問題</option>
                  <option value="violation">不適切なコンテンツ（ダンジョン名・マップ等）の通報</option>
                  <option value="feedback">ご意見・機能追加のご要望</option>
                  <option value="other">その他のお問い合わせ</option>
                </select>
              </div>

              {/* お名前 / ニックネーム */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-xs font-bold text-slate-300">
                  お名前 / ニックネーム <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ダンジョン勇者"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#4fd1d1] transition-colors"
                />
              </div>

              {/* メールアドレス */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-slate-300">
                  メールアドレス <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your-email@example.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#4fd1d1] transition-colors"
                />
              </div>

              {/* 対象のURLまたはID（オプション） */}
              <div className="space-y-2">
                <label htmlFor="targetUrl" className="block text-xs font-bold text-slate-300">
                  対象のURLまたはダンジョンID <span className="text-slate-500 font-normal">（任意）</span>
                </label>
                <input
                  type="text"
                  id="targetUrl"
                  name="targetUrl"
                  value={formData.targetUrl}
                  onChange={handleChange}
                  placeholder="https://dungeonz.net/dungeons/123 などのURLやID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#4fd1d1] transition-colors"
                />
              </div>

              {/* お問い合わせ内容 */}
              <div className="space-y-2">
                <label htmlFor="message" className="block text-xs font-bold text-slate-300">
                  お問い合わせ内容 <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="発生した不具合の状況や、お問い合わせ内容をできるだけ詳しくご記入ください。"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#4fd1d1] transition-colors resize-y"
                />
              </div>

              {/* プライバシーポリシー同意 */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onChange={handleChange}
                    required
                    className="mt-0.5 w-4 h-4 rounded border-slate-800 bg-slate-950 text-[#4fd1d1] focus:ring-[#4fd1d1] focus:ring-offset-slate-950 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                    <Link href="/privacy" target="_blank" className="text-[#4fd1d1] underline hover:text-white">
                      プライバシーポリシー
                    </Link>
                    の内容を確認し、同意した上で送信します。 <span className="text-red-400">*</span>
                  </span>
                </label>
              </div>

              {/* 送信ボタン */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={status === "submitting" || !formData.agreePrivacy}
                  className="w-full py-3 bg-[#4fd1d1] hover:bg-[#3db8b8] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4fd1d1]/10 cursor-pointer disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? (
                    <span className="animate-pulse">送信中...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      送信する
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
