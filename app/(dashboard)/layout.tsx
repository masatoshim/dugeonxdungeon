"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle, LayoutGrid, Heart, History, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { label: "プロフィール", href: "/profile", icon: UserCircle },
  { label: "マイダンジョン一覧", href: "/dungeons", icon: LayoutGrid },
  { label: "お気に入り", href: "/favorites", icon: Heart },
  { label: "履歴", href: "/history", icon: History },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0f111a]">
      {/* サイドバー */}
      <aside className="w-64 bg-[#1a1d2b] flex flex-col py-8 border-r border-gray-800">
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-bold ${
                  isActive ? "text-[#4fd1d1] bg-[#242938]" : "text-gray-400 hover:text-white hover:bg-[#242938]"
                }`}
              >
                <item.icon size={22} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ログアウト */}
        <div className="px-4 mt-auto">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-white transition-colors font-bold"
          >
            <LogOut size={22} />
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 p-12 overflow-y-auto">{children}</main>
    </div>
  );
}
