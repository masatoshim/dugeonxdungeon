"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function DungeonDetailModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
    // モーダル表示時に背景のスクロールを禁止にする
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const onDismiss = () => {
    router.back();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onDismiss}
      className="m-auto backdrop:bg-slate-950/90 p-0 bg-transparent overflow-visible focus:outline-none"
      onClick={(e) => {
        if (e.target === dialogRef.current) onDismiss();
      }}
    >
      <div className="relative w-[95vw] max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* 閉じるボタン：右上に固定 */}
        <button
          onClick={onDismiss}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors z-50 bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full border border-slate-600"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        {/* スクロール可能なコンテンツエリア */}
        <div className="overflow-y-auto custom-scrollbar p-6 md:p-12">{children}</div>
      </div>
    </dialog>
  );
}
