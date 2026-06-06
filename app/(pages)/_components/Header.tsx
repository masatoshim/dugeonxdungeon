"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { AlertCircle, LogIn } from "lucide-react";

export default function Header() {
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const status = sessionContext?.status;
  const router = useRouter();

  // ポップアップの開閉管理
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  // 「創る」をクリックしたときの制御
  const handleCreateClick = (e: React.MouseEvent) => {
    // 未ログインの場合は遷移をブロックしてポップアップを表示
    if (status === "unauthenticated") {
      e.preventDefault();
      setShowLoginAlert(true);
      return;
    }

    // ログイン済みなら適切なダッシュボードへ遷移
    if (session?.user.role === "ADMIN") {
      router.push("/admin/dashboard/dungeons");
    } else {
      router.push("/dashboard/dungeons");
    }
  };

  return (
    <>
      <header className="px-8 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center text-slate-200">
        <div className="flex items-center gap-8">
          {/* ロゴエリア */}
          <Link
            href="/"
            className="font-black text-xl tracking-tighter text-white hover:text-[#4fd1d1] transition-colors"
          >
            DUNGEON<span className="text-[#4fd1d1]">×</span>DUNGEON
          </Link>

          {/* ナビゲーションリンク */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dungeons" className="text-sm font-medium hover:text-[#4fd1d1] transition-colors">
              遊ぶ
            </Link>

            <button
              type="button"
              onClick={handleCreateClick}
              className="text-sm font-medium hover:text-[#4fd1d1] transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              創る
            </button>

            <Link href="/ranking" className="text-sm font-medium hover:text-[#4fd1d1] transition-colors">
              競う
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <span className="text-xs text-slate-500 font-mono animate-pulse">LOADING...</span>
          ) : session ? (
            <div className="flex items-center gap-3">
              {/* ユーザー名 */}
              <span className="hidden sm:inline text-sm font-medium text-slate-300">
                {session.user?.nickName || session.user?.name} <span className="text-xs text-slate-500">さん</span>
              </span>
              <HeaderUserMenu />
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-bold text-[#4fd1d1] hover:text-white border border-[#4fd1d1]/50 hover:bg-[#4fd1d1]/10 px-4 py-1.5 rounded-full transition-all"
            >
              ログイン
            </Link>
          )}
        </div>
      </header>

      {/* 未ログインユーザー用のポップアップ */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowLoginAlert(false)}
          />

          {/* モーダル本体 */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-6 text-slate-200">
            {/* 閉じるボタン（右上） */}
            <button
              type="button"
              onClick={() => setShowLoginAlert(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
              aria-label="閉じる"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* ヘッダー・演出 */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-12 h-12 rounded-full bg-[#4fd1d1]/10 border border-[#4fd1d1]/30 flex items-center justify-center text-[#4fd1d1]">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-white tracking-wide">自分だけのダンジョンを創ろう！</h3>
            </div>

            {/* メッセージ本文 */}
            <p className="text-xs text-slate-400 leading-relaxed text-center">
              アカウントを作成すると、直感的なエディタを使ってオリジナルのダンジョンを自由に作成・公開できるようになります。他のプレイヤーに挑戦してもらいましょう！
            </p>

            {/* アクションボタン */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLoginAlert(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#4fd1d1] hover:bg-[#3db8b8] text-slate-950 text-xs font-black py-2.5 rounded-lg transition-all shadow-lg shadow-[#4fd1d1]/20 active:scale-95 cursor-pointer"
              >
                <LogIn size={14} />
                ログイン / 新規登録
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
