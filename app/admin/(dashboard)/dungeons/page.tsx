"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useGetDungeons } from "@/app/_hooks";
import { useSession } from "next-auth/react";
import { DungeonRow } from "@/app/_components/dungeons/DungeonRow";
import { DungeonFilterBar } from "./_components/DungeonFilterBar";
import { DungeonsIndexResponse, DungeonFilter } from "@/types";

export default function AdminDungeonsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // 各パラメータを取得（DungeonFilterBar の updateQuery とキーを合わせる）
  const currentView = searchParams.get("view") || "admin";
  const currentStatus = searchParams.get("status") || "all";
  const currentSort = searchParams.get("sort") || "createdAt";
  const currentPage = searchParams.get("page") || "1";

  const params: DungeonFilter = {
    sort: currentSort,
    //  index: Number(currentPage),
    isTemplate: currentView === "admin" ? "true" : "false",
    order: "asc",
  };

  if (currentView === "admin") {
    params.userId = session?.user?.id;
  }

  if (currentStatus && currentStatus !== "all") {
    params.statusList = currentStatus;
  }

  const { dungeons, isLoading, mutate } = useGetDungeons(params);

  if (isLoading) return <div className="text-white">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <DungeonFilterBar />
      </header>

      <div className="bg-[#161b2e] rounded-2xl p-8 border border-gray-800 space-y-4">
        {dungeons?.map((dungeon) => (
          <DungeonRow key={dungeon.id} dungeon={dungeon} mutate={mutate} showUserInfo={currentView === "user"} />
        ))}
        <button
          onClick={() => router.push("/dungeons/new")}
          className="w-full py-4 flex items-center justify-center gap-2 bg-[#0f111a] hover:bg-[#1a1d2b] border border-dashed border-gray-700 rounded-xl text-gray-400 transition-colors mt-4"
        >
          <Plus size={20} />
          <span className="font-bold">ダンジョンを追加する</span>
        </button>
      </div>
    </div>
  );
}
