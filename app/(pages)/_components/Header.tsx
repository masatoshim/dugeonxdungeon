"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { AlertCircle, LogIn, Menu, X, Gamepad2, Hammer, Trophy } from "lucide-react";

export default function Header() {
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const status = sessionContext?.status;
  const router = useRouter();

  // ポップアップの開閉管理
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  // モバイルドロワーの開閉管理
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ドロワー開閉時に body のスクロールをロックして右端のズレ・見切れを抑止
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // 「創る」をクリックしたときの制御
  const handleCreateClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    // 未ログインの場合は遷移をブロックしてポップアップを表示
    if (status === "unauthenticated") {
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

  // ドロワー内のリンクタップ時にメニューを閉じる
  const handleNavClick = (action?: () => void) => {
    setIsMenuOpen(false);
    if (action) action();
  };

  return (
    <>
      <header className="px-4 sm:px-8 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center text-slate-200">
        <div className="flex items-center gap-8 min-w-0">
          {/* ロゴエリア */}
          <Link
            href="/"
            className="font-black text-lg sm:text-xl tracking-tighter text-white hover:text-[#4fd1d1] transition-colors shrink-0"
          >
            DUNGEON<span className="text-[#4fd1d1]">×</span>DUNGEON
          </Link>

          {/* PC用ナビゲーションリンク */}
          <nav className="hidden md:flex items-center gap-6 shrink-0">
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

        {/* 右側領域（ユーザーメニュー / モバイル用ハンバーガー） */}
        <div className="flex items-center gap-3 min-w-0">
          {/* PC表示用ユーザーエリア */}
          <div className="hidden md:flex items-center gap-4 min-w-0">
            {status === "loading" ? (
              <span className="text-xs text-slate-500 font-mono animate-pulse">LOADING...</span>
            ) : session ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm font-medium text-slate-300 min-w-0 truncate max-w-[260px] lg:max-w-[260px] xl:max-w-none">
                  {session.user?.nickName || session.user?.name}
                  <span className="text-xs text-slate-500 ml-1 shrink-0">さん</span>
                </span>
                <div className="shrink-0">
                  <HeaderUserMenu />
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-bold text-[#4fd1d1] hover:text-white border border-[#4fd1d1]/50 hover:bg-[#4fd1d1]/10 px-4 py-1.5 rounded-full transition-all shrink-0"
              >
                ログイン
              </Link>
            )}
          </div>

          {/* モバイル用ハンバーガー開閉ボタン */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="md:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* ─── モバイルドロワー ─── */}
      {mounted &&
        isMenuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[999] md:hidden flex justify-end w-screen h-[100dvh] overflow-hidden">
            {/* 背景オーバーレイ */}
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* ドロワー本体 */}
            <aside className="relative w-[260px] max-w-[80vw] h-[100dvh] bg-slate-900 border-l border-slate-800 p-5 flex flex-col justify-between shadow-2xl z-10 box-border overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="font-black text-sm tracking-wider text-slate-400 uppercase">Menu</span>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="flex flex-col gap-2">
                  <Link
                    href="/dungeons"
                    onClick={() => handleNavClick()}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-slate-200 hover:bg-slate-800 hover:text-[#4fd1d1] transition-all"
                  >
                    <Gamepad2 size={18} className="text-[#4fd1d1]" />
                    遊ぶ
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleNavClick(() => handleCreateClick())}
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl font-bold text-slate-200 hover:bg-slate-800 hover:text-[#4fd1d1] transition-all cursor-pointer bg-transparent border-none"
                  >
                    <Hammer size={18} className="text-[#4fd1d1]" />
                    創る
                  </button>

                  <Link
                    href="/ranking"
                    onClick={() => handleNavClick()}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-slate-200 hover:bg-slate-800 hover:text-[#4fd1d1] transition-all"
                  >
                    <Trophy size={18} className="text-[#4fd1d1]" />
                    競う
                  </Link>
                </nav>
              </div>

              {/* ドロワー下部：ユーザー情報＆歯車アイコン */}
              <div className="border-t border-slate-800 pt-4 mt-auto">
                {session ? (
                  <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <HeaderUserMenu onClose={() => setIsMenuOpen(false)} />
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => handleNavClick()}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#4fd1d1] hover:bg-[#3db8b8] text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-[#4fd1d1]/20"
                  >
                    ログイン / 新規登録
                    <LogIn size={16} />
                  </Link>
                )}
              </div>
            </aside>
          </div>,
          document.body,
        )}

      {/* 未ログインユーザー用のポップアップ */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
              <X size={20} />
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
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowLoginAlert(false);
                  router.push("/login");
                }}
                className="w-full sm:flex-1 flex items-center justify-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] sm:text-xs font-black py-2.5 px-2 rounded-lg transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span>ログイン / 新規登録</span>
                <LogIn size={14} className="shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setShowLoginAlert(false)}
                className="w-full sm:flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
