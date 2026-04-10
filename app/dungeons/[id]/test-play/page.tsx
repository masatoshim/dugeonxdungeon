"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { useSession } from "next-auth/react"; // ロール確認用
import { toast } from "sonner"; // トースト用（適宜お使いのライブラリに読み替えてください）
import { MapData } from "@/types";
import { PlayGameContent } from "@/app/dungeons/_components";
import { useGetDungeon, useUpdateDungeon } from "@/app/_hooks";

export default function TestPlayPage() {
  // ゲームの状態管理
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameKey, setGameKey] = useState(0);

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

  // リトライ処理
  const handleRetry = () => {
    setIsGameOver(false);
    setGameKey((prev) => prev + 1); // Keyを更新してPlayGameContentを再生成
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
    <div className="relative">
      <Suspense fallback={<div className="text-white">Loading Dungeon...</div>}>
        <PlayGameContent
          key={gameKey}
          dungeon={dungeon}
          parsedMapData={parsedMapData}
          onClear={handleTestClear}
          onGameOver={() => setIsGameOver(true)}
        />
      </Suspense>
      {/* ゲームオーバー時の選択UI */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="bg-gray-800 p-8 rounded-2xl border-2 border-red-500 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            <h2 className="text-5xl font-black text-red-500 mb-2 italic">GAME OVER</h2>
            <p className="text-gray-400 mb-8">クリア条件を満たせませんでした</p>

            <div className="flex gap-4">
              <button
                onClick={handleRetry}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95"
              >
                リトライ
              </button>
              <button
                onClick={() => router.push("/dungeons")}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
              >
                一覧に戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
