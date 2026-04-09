"use client";

import { Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { MapData } from "@/types";
import { PlayGameContent } from "@/app/dungeons/_components";
import { useGetDungeon } from "@/app/_hooks";

export default function PlayPage() {
  const params = useParams();
  const dungeonId = params.id as string;

  if (!dungeonId) return notFound();

  const { dungeon, isLoading, error } = useGetDungeon(dungeonId);

  if (!dungeon) return notFound();

  const parsedMapData: MapData = (dungeon.mapData as unknown as MapData) ?? {
    tiles: [],
    entities: [],
    settings: { isDark: false, ambientLight: 1.0 },
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Dungeon...</div>
      }
    >
      <PlayGameContent dungeon={dungeon} parsedMapData={parsedMapData} />
    </Suspense>
  );
}
