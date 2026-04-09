"use client";

import { Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { useSession } from "next-auth/react"; // ロール確認用
import { toast } from "sonner"; // トースト用（適宜お使いのライブラリに読み替えてください）
import { MapData } from "@/types";
import { PlayGameContent } from "@/app/dungeons/_components";
import { useGetDungeon, useUpdateDungeon } from "@/app/_hooks";

export default function TestPlayPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const dungeonId = params.id as string;

  if (!dungeonId) return notFound();

  const { dungeon, isLoading } = useGetDungeon(dungeonId);
  const { update } = useUpdateDungeon(dungeonId);

  if (isLoading)
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  if (!dungeon) return notFound();

  const parsedMapData: MapData = (dungeon.mapData as unknown as MapData) ?? {
    tiles: [],
    entities: [],
    settings: { isDark: false, ambientLight: 1.0 },
  };

  const handleTestClear = async (score: number) => {
    try {
      // ステータス更新
      await update({ status: "PUBLISHED" });
      toast.success("テストクリア！ダンジョンを公開しました。");

      const isAdmin = session?.user?.role === "ADMIN";
      const redirectPath = isAdmin ? "/admin/dungeons" : "/dungeons";

      // 該当のダンジョンを光らせるためにIDを渡す
      router.push(`${redirectPath}?highlight=${dungeonId}`);
    } catch (err) {
      toast.error("公開処理に失敗しました。");
    }
  };

  return (
    <Suspense fallback={<div className="text-white">Loading Dungeon...</div>}>
      <PlayGameContent dungeon={dungeon} parsedMapData={parsedMapData} onClear={handleTestClear} />
    </Suspense>
  );
}
