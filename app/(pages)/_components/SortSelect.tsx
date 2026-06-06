"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

// 選択肢の共通型
export interface SortOptionItem {
  label: string;
  value: string;
}

interface SortSelectProps {
  sort: string;
  order: "asc" | "desc";
  options: SortOptionItem[];
  onSelect: (sort: string) => void;
  onOrderToggle: (order: "asc" | "desc") => void;
}

export function SortSelect({ sort, order, options, onSelect, onOrderToggle }: SortSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // コンポーネント外クリックでメニューを閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 現在の選択ラベルを取得
  const currentLabel = options.find((o) => o.value === sort)?.label;

  // 昇順・降順アイコンクリック時の処理
  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // トリガーボタンの開閉イベントとの衝突を防止
    if (!sort) return;

    const nextOrder = order === "asc" ? "desc" : "asc";
    onOrderToggle(nextOrder);
  };

  const handleSelect = (val: string) => {
    onSelect(val);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div className="flex items-center bg-[#1a1d2b] border border-gray-800 rounded-lg overflow-hidden transition-colors hover:border-gray-600 shadow-md">
        {/* 昇順・降順切り替えトグルボタン */}
        <button
          onClick={handleIconClick}
          disabled={!sort}
          className={`p-2 border-r border-gray-800 transition-colors ${
            !sort ? "opacity-30 cursor-not-allowed" : "hover:bg-[#242938] text-cyan-400"
          }`}
          title={order === "asc" ? "昇順" : "降順"}
        >
          <ArrowUpDown
            className={`w-4.5 h-4.5 transition-transform duration-300 ${order === "desc" ? "rotate-180" : ""}`}
          />
        </button>

        {/* ドロップダウンを開閉するトリガー部分 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-4 px-3 py-2 text-sm text-white min-w-[140px] justify-between hover:bg-[#242938] transition-colors"
        >
          <span className="truncate">{currentLabel}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180 text-cyan-400" : "text-gray-400"
            }`}
          />
        </button>
      </div>

      {/* メニューリスト */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-[#141724] border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            {options.map((opt) => {
              const isSelected = sort === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${
                    isSelected
                      ? "bg-slate-800/80 text-cyan-400 font-bold"
                      : "text-slate-300 hover:bg-slate-800/40 hover:text-white"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-cyan-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
