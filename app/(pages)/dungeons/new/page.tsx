"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DungeonEditor } from "@/app/(pages)/dungeons/_components";

export default function NewPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user.role === "ADMIN";
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // 認証チェックが完了し、セッションがない場合
    if (status === "unauthenticated") {
      setShowAlert(true);

      // 3秒後にログイン画面へ飛ばす（またはアラートのOKを押した時）
      const timer = setTimeout(() => {
        router.push("/login?callbackUrl=/dungeons/new");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // ロード中
  if (status === "loading") {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;
  }

  // 未ログイン時の表示
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white p-6">
        <div className="max-w-md w-full bg-gray-900 border border-amber-500/50 p-8 rounded-2xl text-center space-y-4">
          <h2 className="text-2xl font-bold text-amber-500">ログインが必要です</h2>
          <p className="text-gray-400">
            ダンジョンを作成・保存するには、ログインまたは新規登録が必要です。
            <br />
            まもなくログイン画面へ移動します...
          </p>
          <button
            onClick={() => router.push("/login?callbackUrl=/dungeons/new")}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold transition-colors"
          >
            今すぐログインする
          </button>
        </div>
      </div>
    );
  }

  // ログイン済みならエディタを表示
  return <DungeonEditor isAdmin={isAdmin} />;
}
