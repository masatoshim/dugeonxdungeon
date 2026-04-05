"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FilterTab, UserSearchSelect, FilterStatus, SortSelect } from "../_components";

export function DungeonFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 現在の値をURLから取得（なければデフォルト）
  const currentView = searchParams.get("view") || "admin";
  const currentUserId = searchParams.get("userId") || "";
  const currentStatusList = searchParams.get("statusList") || "";
  const currentSort = searchParams.get("sort") || "createdAt";
  const currentOrder = searchParams.get("order") || "asc";

  // URLを更新する共通関数
  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // 管理者タブに切り替える際は、ユーザーID検索をリセットする
    if (key === "view" && value === "admin") params.delete("userId");
    // フィルタ変更時は1ページ目に戻す
    if (key !== "page") params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const updateQueries = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    if (updates.view === "admin") {
      params.delete("userId");
      params.delete("userName");
    }
    // 常に1ページ目に戻す
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {/* 左側：管理者・ユーザー切り替えタブ */}
      <FilterTab value={currentView} onChange={(val) => updateQuery("view", val)} />

      {currentView === "user" && (
        <UserSearchSelect
          selectedUserId={currentUserId}
          onSelect={(id, name) => {
            updateQueries({
              userId: id,
              userName: name,
            });
          }}
        />
      )}

      {/* 右側：絞り込み & ソート */}
      <div className="flex items-center gap-4">
        {/* ステータス絞り込み */}
        <FilterStatus value={currentStatusList} onChange={(val) => updateQuery("statusList", val)} />

        {/* ソート用セレクトボックス */}
        <SortSelect
          sort={currentSort}
          order={currentOrder}
          onSelect={(val) => updateQuery("sort", val)}
          onOrderToggle={(val) => updateQuery("order", val)}
        />
      </div>
    </div>
  );
}
