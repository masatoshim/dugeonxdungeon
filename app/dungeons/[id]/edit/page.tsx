"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DungeonEditor } from "@/app/dungeons/_components";
import { useGetDungeon } from "@/app/_hooks";
import { toast } from "sonner";

export default function EditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const dungeonId = params.id as string;

  // ダンジョンデータのフェッチ
  const { dungeon, isLoading, error } = useGetDungeon(dungeonId);

  // 権限チェック
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/dungeons/${dungeonId}/edit`);
    }

    if (dungeon && session?.user) {
      // 管理者でない、かつ作成者でもない場合はリダイレクト
      const isOwner = dungeon.userId === session.user.id;
      const isAdmin = session.user.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        toast.error("このダンジョンを編集する権限がありません");
        router.push("/dashboard/dungeons");
      }
    }
  }, [status, dungeon, session, router, dungeonId]);

  // ロード中（セッション確認中 or データ取得中）
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 animate-pulse">ダンジョンデータを読み込み中...</p>
      </div>
    );
  }

  // エラー発生時
  if (error || !dungeon) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-500">データが見つかりません</h2>
          <button
            onClick={() =>
              router.push(session?.user.role === "ADMIN" ? "/admin/dashboard/dungeons" : "/dashboard/dungeons")
            }
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
          >
            一覧へ戻る
          </button>
        </div>
      </div>
    );
  }

  // ログイン済み ＆ データ取得済みならエディタを表示
  return <DungeonEditor initialData={dungeon} isAdmin={session?.user?.role === "ADMIN"} />;
}
