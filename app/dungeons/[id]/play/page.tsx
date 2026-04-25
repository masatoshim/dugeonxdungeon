"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { PlayGameContent } from "@/app/dungeons/_components";
import { useGetDungeon, useCreatePlayHistory } from "@/app/_hooks";
import { toast } from "sonner";
import { MapData } from "@/types";
import { PlayStatus } from "@prisma/client";

export default function GamePlayPage() {
  const [isGameOver, setIsGameOver] = useState(false);
  const [isClear, setIsClear] = useState(false);
  const [clearScore, setClearScore] = useState<number>(0);
  const [clearTime, setClearTime] = useState<number | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const router = useRouter();
  const params = useParams();
  const dungeonId = params.id as string;

  const { dungeon, isLoading } = useGetDungeon(dungeonId);
  const { create, isCreating } = useCreatePlayHistory(dungeonId);
  const handleGameEnd = useCallback(
    async (status: PlayStatus, score: number, timeLeft: number) => {
      if (isFinished) return;
      setIsFinished(true);

      const fixedTimeLeft = timeLeft;
      const playTime = Math.max(0, (dungeon?.timeLimit ?? 0) - fixedTimeLeft);
      const clearTime = parseFloat(playTime.toFixed(3));
      const playScore = status === PlayStatus.CLEAR ? score + Math.round(fixedTimeLeft * 100) : score;

      if (status === PlayStatus.CLEAR) {
        setIsClear(true);
      } else {
        setIsGameOver(true);
      }

      setClearTime(clearTime);
      setClearScore(playScore);

      // プレイ記録の登録
      await create({
        playScore,
        playTime: clearTime,
        playStatus: status,
        version: dungeon?.version,
      });
    },
    [isFinished, dungeon, create],
  );

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

  if (isLoading || !dungeon) return <div className="text-white">Loading...</div>;

  return (
    <div className="relative w-full h-screen bg-black">
      <PlayGameContent
        key={gameKey}
        dungeon={dungeon}
        parsedMapData={parsedMapData}
        isFinished={isFinished}
        onClear={(score, timeLeft) => handleGameEnd(PlayStatus.CLEAR, score, timeLeft)}
        onGameOver={(score, timeLeft) => handleGameEnd(PlayStatus.FAILURE, score, timeLeft)}
      />

      {/* クリアリザルト UI */}
      {(isClear || isGameOver) && (
        <div className="absolute inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4">
          <div
            className={`bg-slate-900 border-2 ${isClear ? "border-cyan-500" : "border-red-500"} p-10 rounded-3xl text-center max-w-md w-full shadow-[0_0_50px_rgba(34,211,238,0.2)]`}
          >
            <h2
              className={`text-6xl font-black ${isClear ? "text-cyan-400" : "text-red-500"} mb-2 italic tracking-tighter`}
            >
              {isClear ? "FINISH!" : "GAME OVER"}
            </h2>

            <p className="text-slate-400 mb-6 font-mono text-lg">
              {isClear ? `TIME: ${clearTime}s` : "また挑戦してください"}
            </p>
            <p className="text-slate-400 mb-6 font-mono text-lg">SCORE: {clearScore}</p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsFinished(false);
                  setIsClear(false);
                  setIsGameOver(false);
                  setGameKey((k) => k + 1);
                }}
                className={`w-full py-4 ${isClear ? "bg-cyan-500" : "bg-red-500"} hover:opacity-90 text-slate-950 font-black rounded-xl transition-all`}
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
    </div>
  );
}
