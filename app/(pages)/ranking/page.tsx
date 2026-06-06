"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trophy, Play, BarChart2, AlertCircle, LogIn } from "lucide-react";
import { useGetUsers } from "@/app/_hooks";
import { UserRankingTop3Detail } from "./_componets/UserRankingTop3Detail";
import { UserRankingRowDetail } from "./_componets/UserRankingRowDetail";

export default function UserRankingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 未ログイン時の「登録して挑戦しよう」メッセージの表示制御
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  const { users, isLoading } = useGetUsers({
    playDungeonCountFrom: 1,
    sort: "totalPlayScore",
    order: "desc",
  });

  // 1〜3位と4位以下にデータを分離
  const topThree = users.slice(0, 3);
  const remainingUsers = users.slice(3);

  // 「ランキングを確認する」ボタンの遷移先制御
  const handleCheckRanking = () => {
    if (status === "unauthenticated") {
      // すぐに遷移せず、登録・ログインを促すメッセージカードを表示する
      setShowLoginAlert(true);
      return;
    }

    if (session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard/users?sort=totalPlayScore");
    } else {
      router.push("/dashboard/profile");
    }
  };

  // 「ダンジョンに挑戦する」ボタンの遷移
  const handleChallengeDungeon = () => {
    router.push("/dungeons");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 未ログインユーザー用のポップアップ */}
        {showLoginAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setShowLoginAlert(false)}
            />

            {/* モーダル本体 */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-6">
              {/* 閉じるボタン（右上） */}
              <button
                type="button"
                onClick={() => setShowLoginAlert(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1"
                aria-label="閉じる"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* ヘッダー・グラフィック演出 */}
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-black text-white tracking-wide">登録してダンジョンに挑戦しよう！</h3>
              </div>

              {/* メッセージ本文 */}
              <p className="text-xs text-slate-400 leading-relaxed text-center">
                アカウントを作成すると、あなた自身のスコアがこのランキングに記録され、マイページでいつでもプレイログの確認ができるようになります。
              </p>

              {/* アクションボタン（2カラム） */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLoginAlert(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg transition-colors border border-slate-700"
                >
                  閉じる
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black py-2.5 rounded-lg transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                >
                  <LogIn size={14} />
                  ログイン / 新規登録
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ヘッダー・ナビゲーションエリア */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div className="flex items-center gap-3">
            <Trophy className="text-amber-400 w-8 h-8 animate-bounce" />
            <h1 className="text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Dungeon × Ranking
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCheckRanking}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors text-slate-200"
            >
              <BarChart2 size={14} />
              ランキングを確認する
            </button>
            <button
              type="button"
              onClick={handleChallengeDungeon}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <Play size={14} fill="currentColor" />
              ダンジョンに挑戦する
            </button>
          </div>
        </header>

        {/* 1位〜3位：表彰台トップパネルエリア */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topThree.map((user, index) => (
            <UserRankingTop3Detail key={user.id} user={user} index={index} />
          ))}
        </section>

        {/* 4位以下：リストビューエリア */}
        <section className="bg-slate-900/50 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold text-xs uppercase bg-slate-950/40">
                  <th className="py-4 px-6 text-center w-20">順位</th>
                  <th className="py-4 px-6">ユーザー</th>
                  <th className="py-4 px-6 text-right">トータルスコア</th>
                  <th className="py-4 px-6 text-right">プレイ回数</th>
                  <th className="py-4 px-6 text-right">ダンジョン踏破数</th>
                  <th className="py-4 px-6 text-right">トータルプレイ時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-xs">
                {remainingUsers.map((user, index) => {
                  const rank = index + 4;
                  return <UserRankingRowDetail key={user.id} user={user} rank={rank} />;
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
