"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useGetDungeons } from "@/app/_hooks";
import { useSession } from "next-auth/react";
import { DungeonRow } from "@/app/_components/DungeonRow";
import { DungeonFilterBar } from "./_components/DungeonFilterBar";
import { DungeonsIndexResponse, DungeonFilter } from "@/types";

export default function AdminDungeonsPage() {
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

  // 各パラメータを取得（DungeonFilterBar の updateQuery とキーを合わせる）
  const isAdminMode = (searchParams.get("view") || "admin") === "admin";
  console.info("isAdmin:", isAdminMode);
  const currentUserId = searchParams.get("userId");
  const currentStatusList = searchParams.get("statusList") || "all";
  const currentSort = searchParams.get("sort") || "createdAt";
  const currentOrder: "asc" | "desc" = searchParams.get("order") === "desc" ? "desc" : "asc";
  const highlightId = searchParams.get("highlight");
  // todo: ページ遷移機能を追加する
  const currentPage = searchParams.get("page") || "1";

  // ダンジョン一覧取得パラメータ作成
  // todo: 別コンポーネントに検索項目を増やす
  const params: DungeonFilter = {
    sort: currentSort,
    //  index: Number(currentPage),
    isTemplate: isAdminMode ? "true" : "false",
    order: currentOrder,
  };
  if (isAdminMode) params.userId = session?.user?.id; // 管理者自身
  if (!isAdminMode && currentUserId) params.userId = currentUserId; // ユーザーを指定
  if (currentStatusList && currentStatusList !== "all") params.statusList = currentStatusList;

  const { dungeons, isLoading, mutate } = useGetDungeons(params);

  if (isLoading) return <div className="text-white">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <Suspense>
          <DungeonFilterBar />
        </Suspense>
      </header>

      <div className="bg-[#161b2e] rounded-2xl p-8 border border-gray-800 space-y-4">
        {dungeons?.map((dungeon) => (
          <DungeonRow
            key={dungeon.id}
            dungeon={dungeon}
            mutate={mutate}
            isAdminMode={isAdminMode}
            isHighlighted={highlightId === dungeon.id}
          />
        ))}
        {isAdminMode && (
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
