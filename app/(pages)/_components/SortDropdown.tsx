"use client";

import { ChevronDown, ArrowUpDown } from "lucide-react";

export type SortOption = "createdAt" | "mapSize" | "difficulty" | "timeLimit";
export type SortOrder = "asc" | "desc";

interface SortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  currentOrder: SortOrder;
  onOrderToggle: () => void;
}

export function SortDropdown({ currentSort, onSortChange, currentOrder, onOrderToggle }: SortDropdownProps) {
  const options: { value: SortOption; label: string }[] = [
    { value: "createdAt", label: "最新" },
    { value: "mapSize", label: "ダンジョンサイズ" },
    { value: "difficulty", label: "ダンジョン難しさ" },
    { value: "timeLimit", label: "制限時間" },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {/* ソート順切り替えボタン */}
      <button
        onClick={onOrderToggle}
        className={`p-1.5 rounded-md transition-colors hover:bg-slate-800 ${
          currentOrder === "asc" ? "text-blue-400" : "text-slate-400"
        }`}
        title={currentOrder === "asc" ? "昇順" : "降順"}
      >
        <ArrowUpDown
          className={`w-4.5 h-4.5 transition-transform duration-300 ${currentOrder === "desc" ? "rotate-180" : ""}`}
        />
      </button>
      {/* ドロップダウン部分 */}
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
