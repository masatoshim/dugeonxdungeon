"use client";

import { PlayStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { useGetUser, useUpdateUser, useGetDungeons } from "@/app/_hooks";
import { ProfileCard } from "./_components/ProfileCard";
import { UserStatsCard } from "./_components/UserStatsCard";
import { DungeonSection } from "./_components/DungeonSection";

export default function ProfilePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // 基本ユーザーデータ
  const { user, mutate: mutateUser, isLoading: isUserLoading } = useGetUser(userId);
  const { update } = useUpdateUser(userId!);

  // 構築中ダンジョン (DRAFT)
  const draftParams = useMemo(
    () => ({
      userId,
      status: "DRAFT" as const,
      sort: "updatedAt" as const,
      order: "desc" as const,
      limit: 4,
    }),
    [userId],
  );
  const { dungeons: draftDungeons, isLoading: isDraftLoading } = useGetDungeons(draftParams);

  // お気に入りダンジョン
  const favoriteParams = useMemo(
    () => ({
      isFavoritesList: "true",
      sort: "updatedAt" as const,
      order: "desc" as const,
      limit: 4,
    }),
    [userId],
  );
  const { dungeons: favDungeons, isLoading: isFavLoading } = useGetDungeons(favoriteParams);

  // 最近遊んだダンジョン
  const historyParams = useMemo(
    () => ({
      playStatusList: [PlayStatus.CLEAR, PlayStatus.FAILURE, PlayStatus.INTERRUPT],
      sort: "updatedAt" as const,
      order: "desc" as const,
      limit: 4,
    }),
    [userId],
  );
  const { dungeons: histDungeons, isLoading: isHistLoading } = useGetDungeons(historyParams);

  // ユーザー情報の初期読み込み中のみ、画面全体で待つ
  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-[#4fd1d1] font-mono animate-pulse uppercase tracking-widest">Loading Profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start mb-10 w-full">
        {/* プロフィール詳細 */}
        <div className="w-full lg:w-[380px] shrink-0">
          <ProfileCard user={user} mutate={mutateUser} update={update} />
        </div>
        {/* 統計情報 */}
        <div className="flex-1 min-w-0 w-full">
          <UserStatsCard user={user} />
        </div>
      </div>

      {/* 各ダンジョンリスト */}
      <div className="space-y-8">
        <DungeonSection
          title="構築中のダンジョン"
          viewMoreLink="/dashboard/dungeons"
          dungeons={draftDungeons}
          isLoading={isDraftLoading}
        />
        <DungeonSection
          title="お気に入りダンジョン"
          viewMoreLink="/dashboard/favorites"
          dungeons={favDungeons}
          isLoading={isFavLoading}
        />
        <DungeonSection
          title="最近遊んだダンジョン"
          viewMoreLink="/dashboard/history"
          dungeons={histDungeons}
          isLoading={isHistLoading}
        />
      </div>
    </div>
  );
}
