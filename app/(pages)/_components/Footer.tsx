// components/Footer.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function Footer() {
  const pathname = usePathname();

  const isPlayScreen = pathname?.endsWith("/play") || pathname?.includes("/test-play");
  const isCreateScreen = pathname === "/dungeons/new" || pathname.endsWith("/edit");
  const isDashboardScreen = pathname.startsWith("/dashboard") || pathname.startsWith("/admin/dashboard");

  if (isPlayScreen || isCreateScreen || isDashboardScreen) {
    return null;
  }

  return (
    <footer className="w-full bg-[#0b0f19] border-t border-stone-800/80 py-12 px-6 mt-auto relative z-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="text-sm font-mono font-bold tracking-wider text-stone-200">
            DUNGEONZ<span className="text-[#4fd1d1]">×</span>DUNGEONZ
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-xs text-stone-400 font-mono">
          <Link href="/dungeons" className="hover:text-[#4fd1d1] transition-colors">
            ダンジョン一覧
          </Link>
          <Link href="/ranking" className="hover:text-orange-400 transition-colors">
            ランキング
          </Link>
          <Link href="/terms" className="hover:text-stone-200 transition-colors">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-stone-200 transition-colors">
            プライバシーポリシー
          </Link>
          <Link href="/contact" className="hover:text-stone-200 transition-colors">
            お問い合わせ
          </Link>
        </div>

        <div className="text-xs text-stone-600 font-mono">© {new Date().getFullYear()} DUNGEONZ×DUNGEONZ</div>
      </div>
    </footer>
  );
}
