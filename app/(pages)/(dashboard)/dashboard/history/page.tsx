"use client";

import { Suspense } from "react";
import { HistoryContent } from "@/app/(pages)/(dashboard)/_components/HistoryContent";

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="text-white font-mono animate-pulse">読み込み中...</div>}>
      <HistoryPageContent />
    </Suspense>
  );
}

function HistoryPageContent() {
  return (
    <>
      <HistoryContent />
    </>
  );
}
