"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const status = sessionContext?.status;

  return (
    <header
      style={{
        padding: "1rem 2rem",
        borderBottom: "1px solid #ccc",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        {/* todo: ロゴ画像に切り替える */}
        <Link href="/" style={{ fontWeight: "bold", fontSize: "1.2rem", textDecoration: "none", color: "inherit" }}>
          DUNGEON×DUNGEON
        </Link>

        {/* ナビゲーションリンク */}
        <nav style={{ display: "flex", gap: "1.5rem" }}>
          <Link href="/dungeons" style={{ textDecoration: "none", color: "#333" }}>
            遊ぶ
          </Link>
          <Link
            href={session?.user.role === "ADMIN" ? "/admin/dashboard/dungeons" : "/dashboard/dungeons"}
            style={{ textDecoration: "none", color: "#333" }}
          >
            創る
          </Link>
          <Link href="/ranking" style={{ textDecoration: "none", color: "#333" }}>
            競う
          </Link>
        </nav>
      </div>

      {status === "loading" ? (
        <span>Loading...</span>
      ) : session ? (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* ニックネームを表示（session.userにnickNameがある場合） */}
          <span>{session.user?.nickName || session.user?.name} さん</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ padding: "0.3rem 0.8rem", cursor: "pointer" }}
          >
            ログアウト
          </button>
        </div>
      ) : (
        <Link href="/login" style={{ textDecoration: "none", color: "#4f46e5", fontWeight: "bold" }}>
          ログイン
        </Link>
      )}
    </header>
  );
}
