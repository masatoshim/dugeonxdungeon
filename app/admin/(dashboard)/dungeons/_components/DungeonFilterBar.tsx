"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronDown, Check } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "構築中", value: "DRAFT" },
  { label: "非公開", value: "PRIVATE" },
  { label: "公開済", value: "PUBLISHED" },
  { label: "削除済", value: "DELETED" },
];

const SORT_OPTIONS = [
  { label: "最新", value: "createdAt" },
  { label: "ダンジョンサイズ", value: "mapSize" },
  { label: "ダンジョン難しさ", value: "difficulty" },
  { label: "制限時間", value: "timeLimit" },
];

export function DungeonFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 現在の値をURLから取得（なければデフォルト）
  const currentView = searchParams.get("view") || "admin";
  const currentStatus = searchParams.get("status") || "";
  const currentSort = searchParams.get("sort") || "createdAt";

  // URLを更新する共通関数
  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.set("page", "1"); // フィルタ変更時は1ページ目に戻す
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {/* 左側：管理者・ユーザー切り替えタブ */}
      <div className="flex bg-[#1a1d2b] p-1 rounded-lg border border-gray-800">
        <button
          onClick={() => updateQuery("view", "admin")}
          className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
            currentView === "admin" ? "bg-cyan-400 text-[#0f111a]" : "text-gray-400 hover:text-white"
          }`}
        >
          管理者
        </button>
        <button
          onClick={() => updateQuery("view", "user")}
          className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
            currentView === "user" ? "bg-cyan-400 text-[#0f111a]" : "text-gray-400 hover:text-white"
          }`}
        >
          ユーザー
        </button>
      </div>

      {/* 右側：絞り込み & ソート */}
      <div className="flex items-center gap-4">
        {/* ステータス絞り込み */}
        <div className="flex bg-[#1a1d2b] rounded-lg border border-gray-800 p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateQuery("status", currentStatus === opt.value ? "" : opt.value)}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${
                currentStatus === opt.value ? "bg-[#242938] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ソート用セレクトボックス */}
        <div className="relative group">
          <button className="flex items-center gap-2 bg-[#1a1d2b] border border-gray-800 px-4 py-2 rounded-lg text-sm text-white min-w-[140px] justify-between hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-gray-400" />
              <span>{SORT_OPTIONS.find((o) => o.value === currentSort)?.label}</span>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {/* ドロップダウンメニュー */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl overflow-hidden hidden group-hover:block z-50">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateQuery("sort", opt.value)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                  currentSort === opt.value ? "bg-cyan-400 text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {opt.label}
                {currentSort === opt.value && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
