"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { HeaderUserMenu } from "./HeaderUserMenu";

export default function Header() {
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const status = sessionContext?.status;

  return (
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
          <Link
            href={session?.user.role === "ADMIN" ? "/admin/dashboard/dungeons" : "/dashboard/dungeons"}
            className="text-sm font-medium hover:text-[#4fd1d1] transition-colors"
          >
            創る
          </Link>
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
  );
}
