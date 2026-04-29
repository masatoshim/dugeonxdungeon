"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { MapData } from "@/types";
import { PlayGameContent } from "@/app/(pages)/dungeons/_components";
import { useGetDungeon, useUpdateDungeon } from "@/app/_hooks";

export default function TestPlayPage() {
  const [isGameOver, setIsGameOver] = useState(false);
  const [isClear, setIsClear] = useState(false); // クリア状態を追加
  const [gameKey, setGameKey] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const dungeonId = params.id as string;

  const { dungeon, isLoading } = useGetDungeon(dungeonId);
  const { update } = useUpdateDungeon(dungeonId);

  if (isLoading)
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  if (!dungeon || !dungeonId) return notFound();

  const parsedMapData: MapData = (dungeon.mapData as unknown as MapData) ?? {
    tiles: [],
    entities: [],
    settings: { isDark: false, ambientLight: 1.0 },
  };

  const handleRetry = () => {
    setIsGameOver(false);
    setIsClear(false);
    setGameKey((prev) => prev + 1);
  };

  // 公開 or 非公開の共通処理
  const handlePublishSetting = async (shouldPublish: boolean) => {
    try {
      const status = shouldPublish ? "PUBLISHED" : "PRIVATE";
      await update({ status, publishedAt: status === "PUBLISHED" ? new Date().toISOString() : null });

      toast.success(shouldPublish ? "ダンジョンを公開しました！" : "非公開として保存しました。");

      const isAdmin = session?.user?.role === "ADMIN";
      const redirectPath = isAdmin ? "/admin/dashboard/dungeons" : "/dashboard/dungeons";
      router.push(`${redirectPath}?highlight=${dungeonId}`);
    } catch (err) {
      toast.error("更新に失敗しました。");
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Suspense fallback={<div className="text-white">Loading Dungeon...</div>}>
        <PlayGameContent
          key={gameKey}
          dungeon={dungeon}
          parsedMapData={parsedMapData}
          isFinished={isFinished}
          onClear={() => {
            setIsClear(true);
            setIsFinished(true);
          }}
          onGameOver={() => {
            setIsGameOver(true);
            setIsFinished(true);
          }}
        />
      </Suspense>

      {/* --- ゲームオーバー用 UI --- */}
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
                onClick={() => router.push(`/dungeons/${dungeonId}/edit`)}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
              >
                編集画面に戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- クリア用 UI (新規追加) --- */}
      {isClear && (
        <div className="absolute inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center animate-in zoom-in duration-500">
          <div className="bg-gray-800 p-8 rounded-2xl border-2 border-yellow-500 text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
            <h2 className="text-5xl font-black text-yellow-500 mb-2 italic">CLEAR!!</h2>

            <p className="text-gray-300 mb-8">
              テストプレイに成功しました！
              <br />
              {dungeon.status !== "PUBLISHED" && "このダンジョンを公開しますか？"}
            </p>

            <div className="flex flex-col gap-3">
              {dungeon.status !== "PUBLISHED" && (
                <button
                  onClick={() => handlePublishSetting(true)}
                  className="w-full px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95"
                >
                  世界中に公開する！
                </button>
              )}

              <div className="flex gap-3">
                {dungeon.status !== "PRIVATE" && (
                  <button
                    onClick={() => handlePublishSetting(false)}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
                  >
                    非公開で保存
                  </button>
                )}
                <button
                  onClick={handleRetry}
                  className="flex-1 px-6 py-3 bg-blue-900/50 hover:bg-blue-800 text-blue-200 rounded-xl font-bold border border-blue-700 transition-all"
                >
                  もう一度遊ぶ
                </button>
                <button
                  onClick={() => router.push(`/dungeons/${dungeonId}/edit`)}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
                >
                  編集画面に戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
