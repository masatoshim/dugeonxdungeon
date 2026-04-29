"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUpDown, ChevronDown, Check, ArrowUp, ArrowDown } from "lucide-react";

const SORT_OPTIONS = [
  { label: "最新順", value: "createdAt" },
  { label: "サイズ順", value: "mapSize" },
  { label: "難易度順", value: "difficulty" },
  { label: "制限時間順", value: "timeLimit" },
] as const;

interface SortSelectProps {
  sort: string; // 現在のソート項目 (例: "createdAt")
  order: string; // 現在のオーダー (例: "asc" | "desc")
  onSelect: (sort: string) => void;
  onOrderToggle: (order: string) => void;
}

export function SortSelect({ sort, order, onSelect, onOrderToggle }: SortSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || "ソート";

  // アイコンクリック時の処理
  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 親ボタンの「開閉イベント」を止める
    if (!sort) return; // ソート項目未選択なら何もしない

    const nextOrder = order === "asc" ? "desc" : "asc";
    onOrderToggle(nextOrder);
  };

  const handleSelect = (val: string) => {
    onSelect(val);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center bg-[#1a1d2b] border border-gray-800 rounded-lg overflow-hidden transition-colors hover:border-gray-600">
        {/* 昇順・降順切り替えアイコンボタン */}
        <button
          onClick={handleIconClick}
          disabled={!sort}
          className={`p-2 border-r border-gray-800 transition-colors ${
            !sort ? "opacity-30 cursor-not-allowed" : "hover:bg-[#242938] text-cyan-400"
          }`}
          title={order === "asc" ? "昇順" : "降順"}
        >
          {order === "desc" ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
        </button>

        {/* 項目選択ドロップダウンのトリガー */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-4 px-3 py-2 text-sm text-white min-w-[120px] justify-between"
        >
          <span>{currentLabel}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-cyan-400" : "text-gray-400"}`}
          />
        </button>
      </div>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                  sort === opt.value ? "bg-cyan-50 text-cyan-700 font-bold" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {opt.label}
                {sort === opt.value && <Check size={16} className="text-cyan-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
