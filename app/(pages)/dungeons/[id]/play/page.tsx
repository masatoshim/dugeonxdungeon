"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import { PlayGameContent } from "@/app/(pages)/dungeons/_components";
import { useGetDungeon, useCreatePlayHistory, useCreatePendingClear, useConfirmClear } from "@/app/_hooks";
import { MapData } from "@/game-core/types";
import { PlayStatus } from "@prisma/client";

function GamePlayContentWrapper() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dungeonId = params.id as string;

  const hasPendingQuery =
    searchParams.get("pending") === "true" ||
    (typeof window !== "undefined" && !!localStorage.getItem("pending_clear_id"));

  const [isGameOver, setIsGameOver] = useState(false);
  const [isClear, setIsClear] = useState(hasPendingQuery);
  const [clearScore, setClearScore] = useState<number>(0);
  const [clearTime, setClearTime] = useState<number | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [isFinished, setIsFinished] = useState(hasPendingQuery);
  const [isMyDungeonNotice, setIsMyDungeonNotice] = useState(false);

  const isProcessing = useRef(false);

  const { dungeon, isLoading } = useGetDungeon(dungeonId);
  const { create } = useCreatePlayHistory(dungeonId);
  const { create: createPending, isCreating: isPendingCreating } = useCreatePendingClear();
  const { confirm: confirmClear } = useConfirmClear();

  // 一覧画面に戻るためのURLを保持
  const [returnUrl, setReturnUrl] = useState("/dungeons");

  useEffect(() => {
    // sessionStorageから保持していた一覧ページのURLを取得する
    if (typeof window !== "undefined") {
      const savedUrl = sessionStorage.getItem("dungeon_list_return_url");
      if (savedUrl) {
        setReturnUrl(savedUrl);
      }
    }
  }, []);

  // ログイン画面からのリダイレクト時に発火
  useEffect(() => {
    // ２重起動防止
    const pendingId = typeof window !== "undefined" ? localStorage.getItem("pending_clear_id") : null;
    if (!pendingId || isProcessing.current || status === "loading") return;

    isProcessing.current = true;

    const initPendingClear = async () => {
      // ログイン済み かつ ローカルストレージにIDがあるかチェック
      if (status === "authenticated") {
        setIsFinished(true);
        setIsClear(true);

        try {
          const result = await confirmClear({ pendingId });

          if (result?.isMyDungeon) {
            setIsMyDungeonNotice(true);
          } else if (result) {
            setClearScore(result.playScore);
            setClearTime(result.playTime);
          }
        } catch (err) {
          console.error("履歴登録に失敗しました:", err);
          setIsMyDungeonNotice(true);
        } finally {
          localStorage.removeItem("pending_clear_id");
          router.replace(`/dungeons/${dungeonId}/play`, { scroll: false });
        }
      } else {
        isProcessing.current = false;
        localStorage.removeItem("pending_clear_id");
        router.replace(`/dungeons/${dungeonId}/play`, { scroll: false });
      }
    };
    initPendingClear();
  }, [status, confirmClear, dungeonId, router]);

  const handleGameEnd = useCallback(
    async (playStatus: PlayStatus, score: number, timeLeft: number) => {
      if (isFinished) return;
      setIsFinished(true);

      const playTime = parseFloat(Math.max(0, (dungeon?.timeLimit ?? 0) - timeLeft).toFixed(3));
      const playScore = playStatus === PlayStatus.CLEAR ? score + Math.round(timeLeft * 100) : score;

      if (playStatus === PlayStatus.CLEAR) {
        setIsClear(true);
      } else {
        setIsGameOver(true);
      }

      setClearTime(playTime);
      setClearScore(playScore);

      // 未ログインユーザーの場合、プレイ履歴の登録はされない
      if (!session) return;

      const isMyDungeon = dungeon?.userId === session.user.id;
      if (playStatus === PlayStatus.CLEAR && isMyDungeon) {
        setIsMyDungeonNotice(true);
        return;
      }
      // プレイ記録の登録
      await create({
        playScore,
        playTime,
        playStatus,
        versionMajor: dungeon?.versionMajor,
        versionMinor: dungeon?.versionMinor,
      });
    },
    [isFinished, dungeon, create, session],
  );

  if (isLoading || !dungeonId || (hasPendingQuery && status === "loading")) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-mono">
        読み込み中...
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

  const isGameEnabled = !hasPendingQuery && !isClear && !isGameOver;

  return (
    <div className="relative w-full h-screen bg-black">
      {dungeon && (
        <PlayGameContent
          key={gameKey}
          dungeon={dungeon}
          parsedMapData={parsedMapData}
          enabled={isGameEnabled}
          onClear={(score, timeLeft) => handleGameEnd(PlayStatus.CLEAR, score, timeLeft)}
          onGameOver={(score, timeLeft) => handleGameEnd(PlayStatus.FAILURE, score, timeLeft)}
        />
      )}

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

            {/* 自作ダンジョンのため保存されなかった場合の通知メッセージ */}
            {isMyDungeonNotice && isClear && (
              <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 mb-6">
                <p className="text-amber-400 font-bold text-sm">
                  ※ご自身が作成したダンジョンのため、スコアやクリア履歴は保存されませんでした。
                </p>
              </div>
            )}

            {/* 未ログインユーザーへの表示 */}
            {!session && !isMyDungeonNotice && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <p className="text-slate-300 text-sm mb-1">ゲストモードでプレイ中</p>
                  <p className="text-amber-400 font-bold">
                    ※ログインしていないため、クリア履歴やランキングは保存されません。
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (isPendingCreating || !dungeon) return;
                    try {
                      const result = await createPending({
                        dungeonId,
                        playScore: clearScore,
                        playTime: clearTime ?? 0,
                        versionMajor: dungeon?.versionMajor,
                        versionMinor: dungeon?.versionMinor,
                      });

                      if (result?.pendingId) {
                        // localStorageにpendingId保存
                        localStorage.setItem("pending_clear_id", result.pendingId);
                        // ログイン遷移
                        const callbackUrl = `${window.location.origin}/dungeons/${dungeonId}/play?pending=true`;
                        signIn(undefined, { callbackUrl });
                      }
                    } catch (err) {
                      console.error("Pending clear creation failed:", err);
                    }
                  }}
                  disabled={isPendingCreating}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
                >
                  {isPendingCreating ? "準備中..." : "ログインして記録を残す"}
                </button>
              </div>
            )}

            {/* 共通表示 */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsFinished(false);
                  setIsClear(false);
                  setIsGameOver(false);
                  setIsMyDungeonNotice(false);
                  setGameKey((k) => k + 1);
                }}
                className={`w-full py-4 ${isClear ? "bg-cyan-500" : "bg-red-500"} hover:opacity-90 text-slate-950 font-black rounded-xl transition-all`}
              >
                もう一回挑戦する
              </button>
              <button
                onClick={() => router.push(returnUrl)}
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

export default function GamePlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-mono">
          読み込み中...
        </div>
      }
    >
      <GamePlayContentWrapper />
    </Suspense>
  );
}
