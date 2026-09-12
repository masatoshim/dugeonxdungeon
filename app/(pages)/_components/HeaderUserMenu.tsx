"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { getNavItems } from "@/app/(pages)/_components/navigation";

interface HeaderUserMenuProps {
  onClose?: () => void;
}

export function HeaderUserMenu({ onClose }: HeaderUserMenuProps) {
  const { data: session } = useSession();
  const navItems = getNavItems(session?.user?.role);
  const [isOpen, setIsOpen] = useState(false);

  if (!session) return null;

  return (
    <div className="w-full md:w-auto">
      {/* モバイル表示 */}
      <div className="md:hidden w-full">
        <div className={`flex items-center w-full ${isOpen ? "justify-end" : "justify-between"}`}>
          {!isOpen && (
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-[10px] text-slate-400">ログイン中</span>
              <span className="text-sm font-bold text-slate-200 truncate">
                {session.user?.nickName || session.user?.name}
              </span>
            </div>
          )}

          {/* 歯車ボタン */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isOpen ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
            aria-label="ユーザーメニュー"
          >
            <Settings
              size={20}
              className={`transition-transform duration-300 ${isOpen ? "rotate-90 text-[#4fd1d1]" : ""}`}
            />
          </button>
        </div>

        {isOpen && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 animate-in fade-in duration-150 w-full">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <item.icon size={15} className="text-[#4fd1d1]" />
                {item.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onClose?.();
                signOut({ callbackUrl: "/login" });
              }}
              className="flex items-center gap-3 px-3 py-2 w-full text-left text-xs font-bold text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              ログアウト
            </button>
          </div>
        )}
      </div>

      {/* PC表示 */}
      <div className="hidden md:block relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="ユーザーメニュー"
        >
          <Settings size={20} className="hover:rotate-45 transition-transform duration-300" />
        </button>

        {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1a1d2b] border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="p-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="flex items-center gap-3 px-3 py-2 w-full text-sm text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
