"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { PlayGameContent } from "@/app/dungeons/_components";
import { useGetDungeon, useCreatePlayHistory } from "@/app/_hooks";
import { toast } from "sonner";
import { MapData } from "@/types";

export default function GamePlayPage() {
  const [isGameOver, setIsGameOver] = useState(false);
  const [isClear, setIsClear] = useState(false);
  const [clearScore, setClearScore] = useState<number>(0);
  const [clearTime, setClearTime] = useState<number | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const router = useRouter();
  const params = useParams();
  const dungeonId = params.id as string;

  const { dungeon, isLoading } = useGetDungeon(dungeonId);
  const { create, isCreating } = useCreatePlayHistory(dungeonId);

  if (isLoading || !dungeonId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-mono">
        PREPARING DUNGEON...
      </div>
    );
  }

  if (!isLoading && !dungeon) {
    return notFound();
  }

  const parsedMapData: MapData = (dungeon!.mapData as unknown as MapData) ?? {
    tiles: [],
    entities: [],
    settings: { isDark: false, ambientLight: 1.0 },
  };
  const handleClear = async (score: number, timeLeft: number) => {
    const playTime = dungeon?.timeLimit ?? 0 - timeLeft;
    const playScore = score + playTime;

    setIsClear(true);
    setClearTime(playTime);
    setClearScore(playScore);

    try {
      await create({ playScore, playTime, playStatus: "CLEAR", version: dungeon?.version });
      toast.success("記録がランキングに登録されました！");
    } catch (e) {
      toast.error("記録の保存に失敗しました。");
    }
  };

  if (isLoading || !dungeon) return <div className="text-white">Loading...</div>;

  return (
    <div className="relative w-full h-screen bg-black">
      <PlayGameContent
        key={gameKey}
        dungeon={dungeon}
        parsedMapData={parsedMapData}
        onClear={(score, timeLeft) => handleClear(score, timeLeft)}
        onGameOver={() => setIsGameOver(true)}
      />

      {/* クリアリザルト UI */}

      {isClear && (
        <div className="absolute inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-cyan-500 p-10 rounded-3xl text-center max-w-md w-full shadow-[0_0_50px_rgba(34,211,238,0.2)]">
            <h2 className="text-6xl font-black text-cyan-400 mb-2 italic tracking-tighter">FINISH!</h2>
            <p className="text-slate-400 mb-6 font-mono text-lg">TIME: {clearTime}s</p>
            <p className="text-slate-400 mb-6 font-mono text-lg">SCORE: {clearScore}</p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  (setGameKey((k) => k + 1), setIsClear(false));
                }}
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition-all"
              >
                もう一回挑戦する
              </button>
              <button
                onClick={() => router.push("/dungeons")}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
              >
                一覧画面に戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ゲームオーバー UI も同様に実装 */}
    </div>
  );
}
