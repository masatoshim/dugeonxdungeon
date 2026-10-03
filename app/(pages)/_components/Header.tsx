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

  // ゲームプレイ画面か判定
  const isPlayScreen = pathname?.endsWith("/play");

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
              <span className="text-xs text-slate-500 font-mono animate-pulse">読み込み中...</span>
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
