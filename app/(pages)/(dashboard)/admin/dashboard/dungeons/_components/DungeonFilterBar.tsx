"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FilterTab, UserSearchSelect, FilterStatus, SortSelect } from ".";

export function DungeonFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentView = searchParams.get("view") || "admin";
  const currentUserId = searchParams.get("userId") || "";
  const currentStatusList = searchParams.get("statusList") || "";
  const currentSort = searchParams.get("sort") || "createdAt";
  const currentOrder = searchParams.get("order") || "asc";

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    // 管理者タブへの切り替え時はユーザー検索を完全にリセット
    if (updates.view === "admin") {
      params.delete("userId");
      params.delete("userName");
    }
    // フィルタ変更時は常に1ページ目に戻す
    if (!updates.page) params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {/* 管理者・ユーザー切り替えタブ */}
      <FilterTab value={currentView} onChange={(val) => updateParams({ view: val })} />

      {currentView === "user" && (
        <UserSearchSelect
          selectedUserId={currentUserId}
          onSelect={(id, name) => {
            updateParams({
              userId: id,
              userName: name,
            });
          }}
        />
      )}

      {/* 絞り込み & ソート */}
      <div className="flex items-center gap-4">
        <FilterStatus value={currentStatusList} onChange={(val) => updateParams({ statusList: val })} />

        <SortSelect
          sort={currentSort}
          order={currentOrder}
          onSelect={(val) => updateParams({ sort: val })}
          onOrderToggle={(val) => updateParams({ order: val })}
        />
      </div>
    </div>
  );
}
