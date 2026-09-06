"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { getNavItems } from "@/app/(pages)/_components/navigation";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const navItems = getNavItems(session?.user?.role);
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-16 bottom-0 left-0 right-0 flex w-screen h-[calc(100vh-64px)] overflow-hidden bg-[#0f111a]">
      {/* モバイル用 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* サイドバー */}
      {/* PC: 常時表示 / モバイル: 通常非表示・スライド展開時 */}
      <aside
        className={`fixed md:static top-16 bottom-0 left-0 z-50 w-24 md:w-64 h-[calc(100vh-64px)] bg-[#1a1d2b] flex flex-col pt-4 pb-8 border-r border-slate-800 shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* ナビゲーションリスト */}
        <nav className="flex-1 h-0 px-1.5 md:px-4 space-y-2 md:space-y-3 overflow-y-auto custom-scrollbar pt-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-4 py-2.5 px-1 md:px-4 md:py-3 rounded-xl transition-all font-bold ${
                  isActive
                    ? "text-cyan-400 bg-slate-800/60 shadow-inner"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                {/* アイコン */}
                <item.icon className="shrink-0 w-5 h-5 md:w-6 md:h-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] md:text-base text-center md:text-left leading-tight break-all md:break-normal md:truncate w-full md:w-auto">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ログアウトボタン */}
        <div className="px-1.5 md:px-4 border-t border-slate-800/60 pt-4 md:pt-6 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              signOut({ callbackUrl: "/login" });
            }}
            className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-4 py-2.5 px-1 md:px-4 md:py-3 w-full text-slate-400 hover:text-rose-400 transition-colors font-bold group rounded-xl hover:bg-rose-500/5 cursor-pointer"
          >
            <LogOut className="shrink-0 w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-0 md:group-hover:translate-x-1 transition-transform" />
            <span className="text-[10px] md:text-base text-center md:text-left leading-tight break-all md:break-normal md:truncate w-full md:w-auto">
              ログアウト
            </span>
          </button>
        </div>
      </aside>

      {/* メインコンテンツエリア */}
      <main className="flex-1 h-full p-4 sm:p-6 md:p-12 overflow-y-auto bg-gradient-to-b from-[#0f111a] to-[#0a0b10] w-full">
        {/* モバイル用：トリガーボタン */}
        <div className="md:hidden mb-4 flex items-center">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1d2b] border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Menu size={18} className="text-cyan-400" />
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}
