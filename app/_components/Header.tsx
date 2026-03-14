"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const sessionContext = useSession();

  // sessionContext 自体がない場合や、読み込み中のハンドリング
  const session = sessionContext?.data;
  const status = sessionContext?.status;

  return (
    <header
      style={{ padding: "1rem", borderBottom: "1px solid #ccc", display: "flex", justifyContent: "space-between" }}
    >
      <Link href="/">DUNGEON×DUNGEON</Link>

      {status === "loading" ? (
        <span>Loading...</span>
      ) : session ? (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span>{session.user?.name} さん</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })}>ログアウト</button>
        </div>
      ) : (
        <Link href="/login">ログイン</Link>
      )}
    </header>
  );
}
