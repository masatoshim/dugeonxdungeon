"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { PlayGameContent } from "@/app/dungeons/_components";
import { useGetDungeon, useCreatePlayHistory, useCreatePendingClear, useConfirmClear } from "@/app/_hooks";
import { toast } from "sonner";
import { MapData } from "@/types";
import { PlayStatus } from "@prisma/client";

export default function GamePlayPage() {
  const { status, data: session } = useSession();
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
  const { create: createPending, isCreating: isPendingCreating } = useCreatePendingClear();
  const { confirm: confirmClear, isCreating: isConfirming } = useConfirmClear();

  // ログイン画面からのリダイレクト時に発火
  useEffect(() => {
    const initPendingClear = async () => {
      // ログイン済み かつ ローカルストレージにIDがあるかチェック
      const pendingId = localStorage.getItem("pending_clear_id");

      if (status === "authenticated" && pendingId) {
        // クリア時の状態をセット
        setIsFinished(true);
        setIsClear(true);

        try {
          // プレイ履歴の登録＆一時保存したプレイ履歴の削除
          const history = await confirmClear({ pendingId });

          if (history) {
            setClearScore(history.playScore);
            setClearTime(history.playTime);
            // 登録成功したらストレージを掃除
            localStorage.removeItem("pending_clear_id");
          }
        } catch (err) {
          console.error("履歴登録に失敗しました:", err);
        }
      }
    };
    initPendingClear();
  }, [status, confirmClear]);

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

      // 未ログインユーザーの場合、プレイ履歴の登録はされない
      if (!session) return;

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
      {/* ゲームメイン UI */}
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

            {/* 未ログインユーザーへの表示 */}
            {!session && (
              <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <p className="text-slate-300 text-sm mb-1">ゲストモードでプレイ中</p>
                  <p className="text-amber-400 font-bold">
                    ※ログインしていないため、クリア履歴やランキングは保存されません。
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={async () => {
                      if (isPendingCreating) return;
                      try {
                        const result = await createPending({
                          dungeonId,
                          playScore: clearScore,
                          playTime: clearTime ?? 0,
                          version: dungeon?.version ?? 1,
                        });

                        if (result?.pendingId) {
                          // localStorageにpendingId保存
                          localStorage.setItem("pending_clear_id", result.pendingId);

                          // ログイン遷移
                          const origin = window.location.origin;
                          const callbackUrl = `${origin}/dungeons/${dungeonId}/play`;
                          signIn(undefined, { callbackUrl });
                        }
                      } catch (err) {
                        console.error("Pending clear creation failed:", err);
                      }
                    }}
                    disabled={isPendingCreating}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
                  >
                    {isPendingCreating ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        準備中...
                      </span>
                    ) : (
                      "ログインして記録を残す"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 共通表示 */}
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
