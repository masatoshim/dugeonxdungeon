"use client";

import { DungeonDetailContent } from "@/app/(pages)/_components/detail/DungeonDetailContent";
import { useParams } from "next/navigation";

export default async function Page() {
  const params = useParams();
  const dungeonId = params.id as string;

  return (
    <main className="min-h-screen bg-[#0f172a] p-8">
      <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-12 shadow-2xl">
        <DungeonDetailContent id={dungeonId} />
      </div>
    </main>
  );
}
