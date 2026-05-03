"use client";

import { ChevronDown, ArrowUpDown } from "lucide-react";

export type SortOption = "favoritedAt" | "lastPlayed" | "createdAt" | "mapSize" | "difficulty" | "timeLimit";
export type SortOrder = "asc" | "desc";

interface SortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  currentOrder: SortOrder;
  onOrderToggle: () => void;
  showFavoritedAt?: boolean;
  showLastPlayed?: boolean;
}

export function SortDropdown({
  currentSort,
  onSortChange,
  currentOrder,
  onOrderToggle,
  showFavoritedAt = false,
  showLastPlayed = false,
}: SortDropdownProps) {
  const baseOptions = [
    { value: "createdAt", label: "最新（作成日）" },
    { value: "mapSize", label: "ダンジョンサイズ" },
    { value: "difficulty", label: "ダンジョン難しさ" },
    { value: "timeLimit", label: "制限時間" },
  ];

  // お気に入りページから遷移時
  let options = showFavoritedAt ? [{ value: "favoritedAt", label: "追加した順" }, ...baseOptions] : baseOptions;
  // 履歴ページから遷移時
  options = showLastPlayed ? [{ value: "lastPlayed", label: "最近遊んだ順" }, ...options] : options;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onOrderToggle}
        className={`p-1.5 rounded-md transition-colors hover:bg-slate-800 ${
          currentOrder === "asc" ? "text-blue-400" : "text-slate-400"
        }`}
      >
        <ArrowUpDown
          className={`w-4.5 h-4.5 transition-transform duration-300 ${currentOrder === "desc" ? "rotate-180" : ""}`}
        />
      </button>

      <div className="relative inline-block">
        <select
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="appearance-none bg-[#1e293b] border border-slate-700 text-white text-sm py-1.5 pl-3 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-slate-800 transition-colors"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1e293b]">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
