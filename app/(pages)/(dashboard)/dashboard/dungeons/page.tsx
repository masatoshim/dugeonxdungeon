"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useGetDungeons, useGetUser } from "@/app/_hooks";
import { useSession } from "next-auth/react";
import { DungeonRow } from "@/app/(pages)/_components/list/DungeonRow";
import { useState, Suspense } from "react";

export default function MyDungeonsPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <DungeonsPageContent />
    </Suspense>
  );
}

function DungeonsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { dungeons, isLoading, mutate } = useGetDungeons({
    userId: userId,
    statusList: "DRAFT,PUBLISHED,PRIVATE",
    deletedFlg: "false",
    sort: "createdAt",
    order: "asc",
  });
  const { user } = useGetUser(userId);
  const [dungeonLimit, setDungeonLimit] = useState(user?.createDungeonLimit ?? 10);
  const highlightId = searchParams.get("highlight");

  if (isLoading) return <div className="text-white">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white mb-1">
          {session?.user?.nickName || "ユーザー"} さんのダンジョン一覧
        </h1>
        <p className="text-gray-400 text-sm">※ダンジョンは{dungeonLimit}ステージまで作成できます</p>
      </header>

      <div className="bg-[#161b2e] rounded-2xl p-8 border border-gray-800 space-y-4">
        {dungeons?.map((dungeon) => (
          <DungeonRow
            key={dungeon.id}
            dungeon={dungeon}
            mutate={mutate}
            isAdmin={false}
            isHighlighted={highlightId === dungeon.id}
          />
        ))}
        {/* ダンジョン追加ボタン */}
        {(dungeons?.length || 0) < dungeonLimit && (
          <button
            onClick={() => router.push("/dungeons/new")}
            className="w-full py-4 flex items-center justify-center gap-2 bg-[#0f111a] hover:bg-[#1a1d2b] border border-dashed border-gray-700 rounded-xl text-gray-400 transition-colors mt-4"
          >
            <Plus size={20} />
            <span className="font-bold">ダンジョンを追加する</span>
          </button>
        )}
      </div>
    </div>
  );
}
