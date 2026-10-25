"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { LoginAlertModal } from "./LoginAlertModal";
import { LogIn, Menu, X, Gamepad2, Hammer, Trophy } from "lucide-react";
import { useDungeonAuth } from "@/app/_hooks/useDungeonAuth";

export default function Header() {
  const pathname = usePathname();

  // ポップアップの開閉管理
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const { session, status, handleCreateClick } = useDungeonAuth(() => {
    setShowLoginAlert(true);
  });

  // モバイルドロワーの開閉管理
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  // ゲームプレイ画面か判定
  const isPlayScreen = pathname?.endsWith("/play") || pathname?.includes("/test-play");

  // ダッシュボード画面または編集・作成画面かどうかを判定
  const isCompactPage = pathname?.startsWith("/dashboard") || pathname?.endsWith("/edit") || pathname?.endsWith("/new");

  // スクロール監視
  useEffect(() => {
    setMounted(true);
    // ダッシュボードや編集画面の場合はコンパクトに固定
    if (isCompactPage) {
      setIsScrolled(true);
      return;
    }
    // 通常ページに遷移したときは通常サイズにリセット
    setIsScrolled(false);

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          // トップ付近に戻ったら通常に戻す
          if (y < 5) {
            setIsScrolled(false);
          }
          // 下へスクロールされたらコンパクトにする
          else if (y > 30) {
            setIsScrolled(true);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, isCompactPage]);

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

  // ゲームプレイ画面の場合はヘッダー自体を一切描画しない
  if (isPlayScreen) {
    return null;
  }

  // ドロワー内のリンクタップ時にメニューを閉じる
  const handleNavClick = (action?: () => void) => {
    setIsMenuOpen(false);
    if (action) action();
  };

  return (
    <>
      <header
        className={`px-4 sm:px-8 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center text-slate-200 transition-all duration-300 ${
          isScrolled || isCompactPage ? "py-1.5 shadow-xl bg-slate-950/95" : "py-3.5"
        }`}
      >
        <div className="flex items-center gap-8 min-w-0">
          {/* ロゴエリア */}
          <Link
            href="/"
            className={`flex items-center gap-2 font-black tracking-tighter text-white hover:text-[#4fd1d1] transition-all shrink-0 group ${
              isScrolled || isCompactPage ? "text-sm sm:text-base" : "text-base sm:text-xl"
            }`}
          >
            <span>DUNGEONZ</span>
            {/* クロスした剣のSVGアイコン */}
            <svg
              className={`text-[#4fd1d1] shrink-0 group-hover:rotate-12 transition-all duration-300 ${
                isScrolled || isCompactPage ? "w-3 h-3 sm:w-3.5 sm:h-3.5" : "w-4 h-4 sm:w-5 sm:h-5"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
              <line x1="13" y1="19" x2="19" y2="13" />
              <line x1="16" y1="16" x2="20" y2="20" />
              <line x1="19" y1="21" x2="21" y2="19" />
              <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
              <line x1="5" y1="19" x2="11" y2="13" />
            </svg>
            <span>DUNGEONZ</span>
          </Link>

          {/* PC用ナビゲーションリンク */}
          <nav className="hidden md:flex items-center gap-6 shrink-0">
            <Link
              href="/dungeons"
              className={`font-medium hover:text-[#4fd1d1] transition-all ${isScrolled || isCompactPage ? "text-xs" : "text-sm"}`}
            >
              遊ぶ
            </Link>

            <button
              type="button"
              onClick={handleCreateClick}
              className={`font-medium hover:text-[#4fd1d1] transition-all cursor-pointer bg-transparent border-none p-0 ${
                isScrolled || isCompactPage ? "text-xs" : "text-sm"
              }`}
            >
              創る
            </button>

            <Link
              href="/ranking"
              className={`font-medium hover:text-[#4fd1d1] transition-all ${isScrolled || isCompactPage ? "text-xs" : "text-sm"}`}
            >
              競う
            </Link>
          </nav>
        </div>

        {/* 右側領域（ユーザーメニュー / モバイル用ハンバーガー） */}
        <div className="flex items-center gap-3 min-w-0">
          {/* PC表示用ユーザーエリア */}
          <div className="hidden md:flex items-center gap-4 min-w-0">
            {status === "loading" ? (
              <span className="text-xs text-slate-500 font-mono animate-pulse">読み込み中...</span>
            ) : session ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`font-medium text-slate-300 min-w-0 truncate transition-all ${
                    isScrolled || isCompactPage ? "text-xs max-w-[200px]" : "text-sm max-w-[260px]"
                  }`}
                >
                  {session.user?.nickName || session.user?.name}
                  <span className="text-xs text-slate-500 ml-1 shrink-0">さん</span>
                </span>

                <div className="shrink-0">
                  <HeaderUserMenu />
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`font-bold text-[#4fd1d1] hover:text-white border border-[#4fd1d1]/50 hover:bg-[#4fd1d1]/10 rounded-full transition-all shrink-0 ${
                    isScrolled || isCompactPage ? "text-xs px-3 py-1" : "text-sm px-4 py-1.5"
                  }`}
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  className={`font-bold text-[#4fd1d1] hover:text-white border border-[#4fd1d1]/50 hover:bg-[#4fd1d1]/10 rounded-full transition-all shrink-0 ${
                    isScrolled || isCompactPage ? "text-xs px-3 py-1" : "text-sm px-4 py-1.5"
                  }`}
                >
                  新規登録
                </Link>
              </>
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

      {/* モバイルドロワー */}
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
                    <LogIn size={16} />
                    ログイン / 新規登録
                  </Link>
                )}
              </div>
            </aside>
          </div>,
          document.body,
        )}

      {/* 未ログインユーザー用のポップアップ */}
      <LoginAlertModal isOpen={showLoginAlert} onClose={() => setShowLoginAlert(false)} />
    </>
  );
}
