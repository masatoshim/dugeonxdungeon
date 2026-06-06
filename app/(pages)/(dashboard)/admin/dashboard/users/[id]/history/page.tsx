"use client";

import { Suspense } from "react";
import { useGetUser } from "@/app/_hooks";
import { useParams } from "next/navigation";
import { HistoryContent } from "@/app/(pages)/(dashboard)/_components/HistoryContent";

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="text-white font-mono animate-pulse">Loading...</div>}>
      <HistoryPageContent />
    </Suspense>
  );
}

function HistoryPageContent() {
  const params = useParams();
  const userId = params.id as string;
  const { user } = useGetUser(userId);

  return (
    <>
      <HistoryContent user={user} />
    </>
  );
}
