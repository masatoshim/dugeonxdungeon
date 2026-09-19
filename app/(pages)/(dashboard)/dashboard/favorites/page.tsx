"use client";

import { Suspense } from "react";
import { FavoritesContent } from "@/app/(pages)/(dashboard)/_components/FavoritesContent";

export default function FavoritesPage() {
  return (
    <Suspense fallback={<div className="text-white font-mono animate-pulse">読み込み中...</div>}>
      <FavoritesPageContent />
    </Suspense>
  );
}

function FavoritesPageContent() {
  return (
    <>
      <FavoritesContent />
    </>
  );
}
