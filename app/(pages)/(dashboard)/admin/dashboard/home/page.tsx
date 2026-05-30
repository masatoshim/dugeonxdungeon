"use client";

import { useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { AdminStatsOverview } from "./_components/AdminStatsOverview";
import { useGetUsers, useGetDungeons } from "@/app/_hooks";
import { DungeonSection } from "@/app/(pages)/_components/list/DungeonSection";
import { useSearchParams } from "next/navigation";
import { DungeonDetailModal } from "@/app/(pages)/_components/detail/DungeonDetailModal";
import { DungeonDetailContent } from "@/app/(pages)/_components/detail/DungeonDetailContent";

// 日付操作ヘルパー
const getPastDateISO = (daysOffset: number, hoursOffset: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysOffset);
  date.setHours(date.getHours() - hoursOffset);
  return date.toISOString();
};

export default function AdminHomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading Dashboard...</div>}>
      <AdminHomeContent />
    </Suspense>
  );
}

function AdminHomeContent() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const searchParams = useSearchParams();
  const dungeonId = searchParams.get("dungeonId");

  const dates = useMemo(() => {
    return {
      h24: getPastDateISO(0, 24),
      d3: getPastDateISO(3),
      d7: getPastDateISO(7),
      d10: getPastDateISO(10),
      d30: getPastDateISO(30),
      d60: getPastDateISO(60),
    };
  }, []);

  const userQueryParams = useMemo(
    () => ({
      all: {},
      p24h: { lastLoginAtFrom: dates.h24 },
      p3d: { lastLoginAtFrom: dates.d3, lastLoginAtTo: dates.h24 },
      p7d: { lastLoginAtFrom: dates.d7, lastLoginAtTo: dates.d3 },
      p10d: { lastLoginAtFrom: dates.d10, lastLoginAtTo: dates.d7 },
      p30d: { lastLoginAtFrom: dates.d30, lastLoginAtTo: dates.d10 },
      pOver: { lastLoginAtTo: dates.d30 },
    }),
    [dates],
  );

  const dungeonQueryParams = useMemo(
    () =>
      ({
        userTotal: { isTemplate: "false" },
        adminTotal: { isTemplate: "true" },
        p3d: { isTemplate: "false", createdAtFrom: dates.d3 },
        p10d: { isTemplate: "false", createdAtFrom: dates.d10, createdAtTo: dates.d3 },
        p30d: { isTemplate: "false", createdAtFrom: dates.d30, createdAtTo: dates.d10 },
        p60d: { isTemplate: "false", createdAtFrom: dates.d60, createdAtTo: dates.d30 },
        pOver: { isTemplate: "false", createdAtTo: dates.d60 },
      }) as const,
    [dates],
  );

  // ユーザー数のデータ取得
  const { totalCount: userTotal } = useGetUsers(userQueryParams.all);
  const { totalCount: login24h } = useGetUsers(userQueryParams.p24h);
  const { totalCount: login3d } = useGetUsers(userQueryParams.p3d);
  const { totalCount: login7d } = useGetUsers(userQueryParams.p7d);
  const { totalCount: login10d } = useGetUsers(userQueryParams.p10d);
  const { totalCount: login30d } = useGetUsers(userQueryParams.p30d);
  const { totalCount: loginOver30d } = useGetUsers(userQueryParams.pOver);

  // ダンジョン数のデータ取得
  const { totalCount: userDungeonTotal } = useGetDungeons(dungeonQueryParams.userTotal);
  const { totalCount: adminDungeonTotal } = useGetDungeons(dungeonQueryParams.adminTotal);
  const dungeonTotalCount = (userDungeonTotal || 0) + (adminDungeonTotal || 0);

  const { totalCount: dg3d } = useGetDungeons(dungeonQueryParams.p3d);
  const { totalCount: dg10d } = useGetDungeons(dungeonQueryParams.p10d);
  const { totalCount: dg30d } = useGetDungeons(dungeonQueryParams.p30d);
  const { totalCount: dg60d } = useGetDungeons(dungeonQueryParams.p60d);
  const { totalCount: dgOver60d } = useGetDungeons(dungeonQueryParams.pOver);

  const userStatsData = {
    total: userTotal || 0,
    periods: [
      { name: "24時間以内:", count: login24h || 0 },
      { name: "~3日以内:", count: login3d || 0 },
      { name: "~7日以内:", count: login7d || 0 },
      { name: "~10日以内:", count: login10d || 0 },
      { name: "~30日以内:", count: login30d || 0 },
      { name: "~以降:", count: loginOver30d || 0 },
    ],
  };

  const dungeonStatsData = {
    total: dungeonTotalCount,
    periods: [
      { name: "~3日以内:", count: dg3d || 0 },
      { name: "~10日以内:", count: dg10d || 0 },
      { name: "~30日以内:", count: dg30d || 0 },
      { name: "~60日以内:", count: dg60d || 0 },
      { name: "~以降:", count: dgOver60d || 0 },
    ],
    adminCount: adminDungeonTotal || 0,
  };

  // 管理者のダンジョン
  const adminParams = useMemo(
    () => ({
      isTemplate: "true" as const,
      sort: "updatedAt" as const,
      order: "desc" as const,
      limit: 4,
    }),
    [userId],
  );
  const { dungeons: adminDungeons, isLoading: isDraftLoading } = useGetDungeons(adminParams);

  // ユーザー新規作成ダンジョン
  const userParams = useMemo(
    () => ({
      isTemplate: "false" as const,
      sort: "updatedAt" as const,
      order: "desc" as const,
      limit: 4,
    }),
    [userId],
  );
  const { dungeons: userDungeons, isLoading: isFavLoading } = useGetDungeons(userParams);

  // 人気ダンジョン
  const favParams = useMemo(
    () => ({
      sort: "favoritesCount" as const,
      order: "desc" as const,
      limit: 4,
    }),
    [userId],
  );
  const { dungeons: favDungeons, isLoading: isHistLoading } = useGetDungeons(favParams);

  return (
    <div className="p-6 pt-0">
      <div className="flex flex-col lg:flex-row gap-6 items-start mb-10 w-full">
        <AdminStatsOverview userStats={userStatsData} dungeonStats={dungeonStatsData} />
      </div>
      {/* 各ダンジョンリスト */}
      <div className="space-y-8">
        <DungeonSection
          title="管理者のダンジョン"
          viewMoreLink="/admin/dashboard/dungeons?view=admin"
          dungeons={adminDungeons}
          isLoading={isDraftLoading}
        />
        <DungeonSection
          title="ユーザー新規作成ダンジョン"
          viewMoreLink="/admin/dashboard/dungeons?view=user&sort=createdAt"
          dungeons={userDungeons}
          isLoading={isFavLoading}
        />
        <DungeonSection
          title="人気ダンジョン"
          viewMoreLink="/admin/dashboard/dungeons?view=user&sort=favoritesCount"
          dungeons={favDungeons}
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
