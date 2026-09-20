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
      if (isMyDungeon) {
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className={`relative bg-slate-900/90 border ${
              isClear
                ? "border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.15)]"
                : "border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
            } p-8 sm:p-10 rounded-2xl text-center max-w-md w-full backdrop-blur-xl animate-in zoom-in-95 duration-300`}
          >
            {/* ヘッダータイトル */}
            <div className="mb-6">
              <span
                className={`text-xs font-mono tracking-widest uppercase px-3 py-1 rounded-full ${
                  isClear
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {isClear ? "STAGE CLEARED" : "MISSION FAILED"}
              </span>
              <h2
                className={`text-5xl sm:text-6xl font-black ${isClear ? "text-cyan-400" : "text-red-500"} mt-3 italic tracking-tighter drop-shadow-md`}
              >
                {isClear ? "FINISH!" : "GAME OVER"}
              </h2>
            </div>

            {/* スコア・タイム表示カード */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl">
                <p className="text-xs text-slate-400 font-mono mb-1">TIME</p>
                <p className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {isClear ? `${clearTime ?? 0} sec` : "--:--"}
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl">
                <p className="text-xs text-slate-400 font-mono mb-1">SCORE</p>
                <p className="text-xl sm:text-2xl font-bold font-mono text-amber-400">{clearScore} pt</p>
              </div>
            </div>

            {/* 自作ダンジョンのため保存されなかった場合の通知メッセージ */}
            {isMyDungeonNotice && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl mb-6 text-left">
                <p className="text-amber-400 text-xs leading-relaxed font-medium">
                  ※ご自身が作成したダンジョンのため、スコアやクリア履歴は保存されませんでした。
                </p>
              </div>
            )}

            {/* 未ログインユーザーへの表示 */}
            {!session && !isMyDungeonNotice && (
              <div className="space-y-4 mb-6">
                <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-xl text-left">
                  <p className="text-slate-300 text-xs mb-0.5">ゲストモードでプレイ中</p>
                  <p className="text-blue-400 text-xs font-semibold">
                    ログインするとクリア履歴やランキングに反映されます。
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
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                >
                  {isPendingCreating ? "処理中..." : "ログインして記録を残す"}
                </button>
              </div>
            )}

            {/* アクションボタン */}
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setIsFinished(false);
                  setIsClear(false);
                  setIsGameOver(false);
                  setIsMyDungeonNotice(false);
                  setGameKey((k) => k + 1);
                }}
                className={`w-full py-3.5 px-4 ${
                  isClear
                    ? "bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-400/20"
                    : "bg-red-500 hover:bg-red-400 text-white shadow-red-500/20"
                } font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98]`}
              >
                もう一回挑戦する
              </button>
              <button
                onClick={() => router.push(returnUrl)}
                className="w-full py-3 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm rounded-xl border border-slate-700 transition-all active:scale-[0.98]"
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
