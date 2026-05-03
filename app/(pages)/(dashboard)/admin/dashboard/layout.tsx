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
    <div className="flex min-h-screen bg-[#0f111a]">
      {/* サイドバー */}
      <aside className="w-64 bg-[#1a1d2b] flex flex-col py-8 border-r border-gray-800">
        <nav className="flex-1 px-4 space-y-4">
          {" "}
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all font-bold ${
                  isActive ? "text-cyan-400 bg-[#242938]" : "text-gray-400 hover:text-white hover:bg-[#242938]"
                }`}
              >
                <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-lg">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ログアウト */}
        <div className="px-4 mt-auto border-t border-gray-800 pt-6">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-4 px-4 py-3 w-full text-gray-400 hover:text-white transition-colors font-bold group"
          >
            <LogOut size={26} className="group-hover:translate-x-1 transition-transform" />
            <span className="text-lg">ログアウト</span>
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 p-12 overflow-y-auto">{children}</main>
    </div>
  );
}
