"use client";

import { useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { MapData } from "@/game-core/types";
import { PlayGameContent } from "@/app/(pages)/dungeons/_components";
import { useGetDungeon, useUpdateDungeon } from "@/app/_hooks";
import { Lock, RotateCcw } from "lucide-react";

export default function TestPlayPage() {
  const [isGameOver, setIsGameOver] = useState(false);
  const [isClear, setIsClear] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const dungeonId = params.id as string;

  const { dungeon, isLoading } = useGetDungeon(dungeonId);
  const { update } = useUpdateDungeon(dungeonId);

  if (isLoading)
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">読み込み中...</div>;
  if (!dungeon || !dungeonId) return notFound();

  const parsedMapData: MapData = (dungeon.mapData as unknown as MapData) ?? {
    tiles: [],
    entities: [],
    settings: { isDark: false, ambientLight: 1.0 },
  };

  const handleRetry = () => {
    setIsGameOver(false);
    setIsClear(false);
    setIsFinished(false);
    setGameKey((prev) => prev + 1);
  };

  // 公開 or 非公開の共通処理
  const handlePublishSetting = async (shouldPublish: boolean) => {
    try {
      const status = shouldPublish ? "PUBLISHED" : "PRIVATE";

      // Majorバージョンを上げ、Minorを0にリセットする
      const versionPayload = shouldPublish
        ? {
            versionMajor: (dungeon.versionMajor ?? 0) + 1,
            versionMinor: 0,
          }
        : {};

      await update({
        status,
        publishedAt: status === "PUBLISHED" ? new Date().toISOString() : null,
        ...versionPayload,
      });

      toast.success(shouldPublish ? "ダンジョンを世界中に公開しました！" : "非公開として保存しました。");

      const isAdmin = session?.user?.role === "ADMIN";
      const redirectPath = isAdmin ? "/admin/dashboard/dungeons" : "/dashboard/dungeons";
      router.push(`${redirectPath}?highlight=${dungeonId}`);
    } catch (err) {
      toast.error("更新に失敗しました。");
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Suspense fallback={<div className="text-white">読み込み中...</div>}>
        <PlayGameContent
          key={gameKey}
          dungeon={dungeon}
          parsedMapData={parsedMapData}
          onClear={() => {
            setIsClear(true);
            setIsFinished(true);
          }}
          onGameOver={() => {
            setIsGameOver(true);
            setIsFinished(true);
          }}
          // テストプレイ中の中断時は編集画面に戻るようにする
          onInterrupt={() => {
            router.push(`/dungeons/${dungeonId}/edit`);
          }}
          enabled={!isFinished} // 終了時はゲーム操作を無効化
          isTestPlay={true}
        />
      </Suspense>

      {/* --- ゲームオーバー用 UI --- */}
      {isGameOver && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-stone-900/90 border border-red-500/30 p-8 rounded-3xl text-center shadow-[0_0_60px_rgba(239,68,68,0.15)] backdrop-blur-xl">
            <h2 className="text-4xl font-extrabold tracking-wider text-red-500 mb-2 font-serif italic drop-shadow-md">
              GAME OVER
            </h2>
            <p className="text-sm text-stone-400 mb-8">クリア条件を満たせませんでした</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/25 active:scale-[0.98] cursor-pointer"
              >
                リトライ
              </button>
              <button
                onClick={() => router.push(`/dungeons/${dungeonId}/edit`)}
                className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-medium text-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                編集画面に戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- クリア用 UI --- */}
      {isClear && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-md bg-stone-900/90 border border-amber-500/30 p-8 rounded-3xl text-center shadow-[0_0_60px_rgba(245,158,11,0.15)] backdrop-blur-xl">
            <h2 className="text-4xl font-extrabold tracking-wider text-amber-400 mb-2 font-serif italic drop-shadow-md">
              CLEAR!!
            </h2>

            <p className="text-sm text-stone-300 mb-6 leading-relaxed">
              テストプレイに成功しました！
              {dungeon.status !== "PUBLISHED" && (
                <>
                  <br />
                  <span className="text-amber-400/90 font-medium">このダンジョンを公開しますか？</span>
                </>
              )}
            </p>

            <div className="flex flex-col gap-3">
              {dungeon.status !== "PUBLISHED" && (
                <button
                  onClick={() => handlePublishSetting(true)}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-extrabold text-base rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  世界中に公開する！
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                {dungeon.status !== "PRIVATE" && (
                  <button
                    onClick={() => handlePublishSetting(false)}
                    className="flex items-center justify-center gap-1.5 py-3 px-3 bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-stone-100 rounded-xl font-medium text-xs border border-stone-700/50 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Lock size={14} className="text-stone-400" />
                    非公開で保存
                  </button>
                )}
                <button
                  onClick={handleRetry}
                  className="flex items-center justify-center gap-1.5 py-3 px-3 bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-stone-100 rounded-xl font-medium text-xs border border-stone-700/50 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <RotateCcw size={14} className="text-stone-400" />
                  もう一度遊ぶ
                </button>
              </div>

              <button
                onClick={() => router.push(`/dungeons/${dungeonId}/edit`)}
                className="w-full py-3 bg-transparent hover:bg-stone-800/50 text-stone-400 hover:text-stone-200 rounded-xl font-medium text-xs transition-all cursor-pointer mt-1"
              >
                編集画面に戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
