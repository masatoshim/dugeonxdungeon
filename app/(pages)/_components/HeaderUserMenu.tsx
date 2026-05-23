"use client";

import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { getNavItems } from "@/app/(pages)/_components/navigation";

export function HeaderUserMenu() {
  const { data: session } = useSession();
  const navItems = getNavItems(session?.user?.role);

  if (!session) return null;

  return (
    <div className="flex items-center">
      {/* 歯車アイコンとメニューの親コンテナ */}
      <div className="relative group">
        <button className="p-1 text-slate-400">
          <Settings size={20} className="group-hover:rotate-45 transition-transform duration-300" />
        </button>

        {/* ドロップダウンメニュー本体 */}
        <div className="absolute right-0 top-[90%] w-56 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="bg-[#1a1d2b] border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="p-2 border-t border-slate-700">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-3 py-2 w-full text-sm text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
