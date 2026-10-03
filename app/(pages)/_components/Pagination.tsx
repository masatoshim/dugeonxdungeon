"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all"
        title="前のページ"
      >
        <ChevronLeft size={18} />
      </button>

      <span className="text-sm font-medium text-slate-300 px-4">
        <strong className="text-white">{currentPage}</strong> / {totalPages} ページ
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all"
        title="次のページ"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
