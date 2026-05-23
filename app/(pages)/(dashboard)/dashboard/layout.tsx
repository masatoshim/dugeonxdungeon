"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { getNavItems } from "@/app/(pages)/_components/navigation";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const navItems = getNavItems(session?.user?.role);
  const pathname = usePathname();

  return (
    <div className="fixed top-16 bottom-0 left-0 right-0 flex w-screen h-[calc(100vh-64px)] overflow-hidden bg-[#0f111a]">
      {/* サイドバー */}
      <aside className="w-64 h-full bg-[#1a1d2b] flex flex-col pt-4 pb-8 border-r border-slate-800 shrink-0">
        {/* ナビゲーション */}
        <nav className="flex-1 h-0 px-4 space-y-3 overflow-y-auto custom-scrollbar pt-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold ${
                  isActive
                    ? "text-cyan-400 bg-slate-800/60 shadow-inner"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-base tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ログアウト */}
        <div className="px-4 border-t border-slate-800/60 pt-6 shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-4 px-4 py-3 w-full text-slate-400 hover:text-rose-400 transition-colors font-bold group rounded-xl hover:bg-rose-500/5 cursor-pointer"
          >
            <LogOut size={24} className="group-hover:translate-x-1 transition-transform" />
            <span className="text-base tracking-wide">ログアウト</span>
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 h-full p-12 overflow-y-auto bg-gradient-to-b from-[#0f111a] to-[#0a0b10]">
        {children}
      </main>
    </div>
  );
}
