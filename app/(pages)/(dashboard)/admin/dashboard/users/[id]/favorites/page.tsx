"use client";

import { Suspense } from "react";
import { useGetUser } from "@/app/_hooks";
import { useParams } from "next/navigation";
import { FavoritesContent } from "@/app/(pages)/(dashboard)/_components/FavoritesContent";

export default function FavoritesPage() {
  return (
    <Suspense fallback={<div className="text-white font-mono animate-pulse">Loading...</div>}>
      <FavoritesPageContent />
    </Suspense>
  );
}

function FavoritesPageContent() {
  const params = useParams();
  const userId = params.id as string;
  const { user } = useGetUser(userId);

  return (
    <>
      <FavoritesContent user={user} />
    </>
  );
}
