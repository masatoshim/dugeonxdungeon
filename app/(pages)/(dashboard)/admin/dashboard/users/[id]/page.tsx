"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
  useGetUser,
  useUpdateUser,
  useDeleteUser,
  useGetDungeons,
  useGetFavoriteDungeons,
  usegetPlayHistoryDungeons,
} from "@/app/_hooks";
import { ProfileCard } from "@/app/(pages)/(dashboard)/_components/ProfileCard";
import { UserStatsCard } from "@/app/(pages)/(dashboard)/_components/UserStatsCard";
import { useSearchParams } from "next/navigation";
import { DungeonDetailModal } from "@/app/(pages)/_components/detail/DungeonDetailModal";
import { DungeonDetailContent } from "@/app/(pages)/_components/detail/DungeonDetailContent";
import { DungeonSection } from "@/app/(pages)/_components/list/DungeonSection";
import { Suspense } from "react";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const params = useParams();
  const userId = params.id as string;

  const searchParams = useSearchParams();
  const dungeonId = searchParams.get("dungeonId");

  // 基本ユーザーデータ
  const { user, mutate: mutateUser, isLoading: isUserLoading } = useGetUser(userId);
  const { update } = useUpdateUser(userId!);
  const { remove } = useDeleteUser(userId!);

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
      userId,
      sort: "updatedAt" as const,
      order: "desc" as const,
      limit: 4,
    }),
    [userId],
  );
  const { dungeons: favDungeons, isLoading: isFavLoading } = useGetFavoriteDungeons(favoriteParams);

  // 最近遊んだダンジョン
  const historyParams = useMemo(
    () => ({
      userId,
      sort: "updatedAt" as const,
      order: "desc" as const,
      limit: 4,
    }),
    [userId],
  );
  const { dungeons: histDungeons, isLoading: isHistLoading } = usegetPlayHistoryDungeons(historyParams);

  // ユーザー情報の初期読み込み中のみ、画面全体で待つ
  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-[#4fd1d1] font-mono animate-pulse uppercase tracking-widest">Loading Profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pb-6 pt-0">
      <div className="flex flex-col lg:flex-row gap-6 items-start mb-10 w-full">
        {/* プロフィール詳細 */}
        <div className="w-full lg:w-[380px] shrink-0">
          <ProfileCard user={user} mutate={mutateUser} update={update} remove={remove} isAdminMode={true} />
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
          viewMoreLink={`/admin/dashboard/dungeons/?view=user&userId=${user.id}&statusList=DRAFT`}
          dungeons={draftDungeons}
          isLoading={isDraftLoading}
        />
        <DungeonSection
          title="お気に入りダンジョン"
          viewMoreLink={`/admin/dashboard/users/${user.id}/favorites`}
          dungeons={favDungeons}
          isLoading={isFavLoading}
        />
        <DungeonSection
          title="最近遊んだダンジョン"
          viewMoreLink={`/admin/dashboard/users/${user.id}/history`}
          dungeons={histDungeons}
          isLoading={isHistLoading}
        />
      </div>

      {/* ダンジョン詳細モーダル表示 */}
      {dungeonId && (
        <DungeonDetailModal>
          <DungeonDetailContent id={dungeonId} />
        </DungeonDetailModal>
      )}
    </div>
  );
}
