"use client";

import { useSession } from "next-auth/react";
import { useState, Suspense } from "react";
import { useGetUser, useUpdateUser, useProfileIcon } from "@/app/_hooks";
import { ProfileCard } from "./_components/ProfileCard";
import { UserStatsCard } from "./_components/UserStatsCard";

export default function ProfilePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // 親でデータ取得を一括管理
  const { user, mutate, isLoading } = useGetUser(userId);
  const { update } = useUpdateUser(userId!);

  if (isLoading || !user) return <div>Loading...</div>;

  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start mb-10 w-full">
          {/* プロフィール詳細 */}
          <div className="w-full lg:w-[380px] shrink-0">
            <ProfileCard user={user} mutate={mutate} update={update} />
          </div>
          {/* 統計情報 */}
          <div className="flex-1 min-w-0 w-full">
            <UserStatsCard user={user} />
          </div>
        </div>

        {/* 下部グリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ここにダンジョンリスト等を配置 */}
        </div>
      </div>
    </Suspense>
  );
}
