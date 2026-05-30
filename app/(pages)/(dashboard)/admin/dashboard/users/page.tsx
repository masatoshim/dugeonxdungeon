"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense } from "react";
import { UserListTable } from "./_components/UserListTable";
import { SortSelect, SortOptionItem } from "@/app/(pages)/_components/SortSelect";
import { useGetUsers } from "@/app/_hooks";

// ユーザー一覧用のソート項目定義
const USER_SORT_OPTIONS: SortOptionItem[] = [
  { label: "トータルスコア", value: "totalPlayScore" },
  { label: "トータルプレイ時間", value: "totalPlayTime" },
  { label: "構築ダンジョン数", value: "dungeonCount" },
];

export default function AdminUserListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading Dashboard...</div>}>
      <AdminUserListPageContent />
    </Suspense>
  );
}

function AdminUserListPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ─── クエリパラメータの取得 ───
  const currentSort = searchParams.get("sort") || "totalPlayScore";
  const orderParam = searchParams.get("order");
  const currentOrder: "asc" | "desc" = orderParam === "desc" ? "asc" : "desc";
  const currentPage = Number(searchParams.get("page")) || 1;
  const itemsPerPage = 5; // 1ページあたりの表示件数

  const updateQueryParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    if (updates.sort || updates.order) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const { users, totalCount } = useGetUsers({ sort: currentSort, order: currentOrder });

  return (
    <div className="w-full bg-[#0b0f19] min-h-screen p-0 text-slate-300">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-white tracking-wide">ユーザー管理一覧</h1>
          <SortSelect
            sort={currentSort}
            order={currentOrder}
            options={USER_SORT_OPTIONS}
            onSelect={(val) => updateQueryParams({ sort: val })}
            onOrderToggle={(val) => updateQueryParams({ order: val })}
            placeholder="並び替え"
          />
        </div>

        <UserListTable users={users} currentPage={currentPage} itemsPerPage={itemsPerPage} />
      </div>
    </div>
  );
}
