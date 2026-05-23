"use client";

import { PieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
import { UserResponse } from "@/types";

interface UserStatsCardProps {
  user: UserResponse;
}

export function UserStatsCard({ user }: UserStatsCardProps) {
  const chartData = [
    { name: "踏破", value: user.clearPlayCount, fill: "#ef4444" },
    { name: "失敗", value: user.failurePlayCount, fill: "#b91c1c" },
    { name: "中断", value: user.interruptPlayCount, fill: "#7f1d1d" },
  ];

  return (
    <div className="bg-[#1a1d2b] border border-slate-700 rounded-2xl p-8 w-full shadow-xl min-h-[580px] flex flex-col">
      {/* コンポーネント上部：ランキング・スコア・時間 */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* 左：総合ランキング */}
        <div className="flex-1 bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col items-center justify-center">
          <span className="text-[#4fd1d1] text-xs font-mono tracking-widest uppercase mb-1">総合ランキング</span>
          <span className="text-3xl font-bold text-white font-mono">#{user.rank ? user.rank : "---"}</span>
        </div>

        {/* 右：スコアと時間をさらに横並びにする */}
        <div className="flex-[2] flex flex-row gap-4">
          {/* スコア用ボックス */}
          <div className="flex-1 bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col justify-center">
            <span className="text-[#4fd1d1] text-xs font-mono tracking-widest uppercase mb-1 text-center lg:text-left">
              トータルスコア
            </span>
            <span className="text-xl font-bold text-white font-mono text-center lg:text-left">
              {user.totalPlayScore.toLocaleString()} <span className="text-xs ml-1">pt</span>
            </span>
          </div>

          {/* プレイ時間用ボックス */}
          <div className="flex-1 bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col justify-center">
            <span className="text-[#4fd1d1] text-xs font-mono tracking-widest uppercase mb-1 text-center lg:text-left">
              トータル時間
            </span>
            <span className="text-xl font-bold text-white font-mono text-center lg:text-left">
              {user.totalPlayTime.toLocaleString()} <span className="text-xs ml-1">sec</span>
            </span>
          </div>
        </div>
      </div>

      {/* コンポーネント下部：数値リストと円グラフ */}
      <div className="flex flex-col lg:flex-row gap-8 mt-4 flex-1">
        {/* 左側：数値リスト */}
        <div className="flex-1 space-y-3">
          {[
            { label: "トータルプレイ回数", value: user.totalPlayCount },
            { label: "挑戦ダンジョン数", value: user.playDungeonCount },
            { label: "踏破済みダンジョン数", value: user.clearPlayCount },
            { label: "失敗ダンジョン数", value: user.failurePlayCount },
            { label: "中断ダンジョン数", value: user.interruptPlayCount },
            { label: "マイダンジョン数", value: user.dungeonCount },
            { label: "公開済みダンジョン数", value: user.publishedDungeonCount },
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between border-b border-slate-700/50 pb-1">
              <span className="text-sm text-[#4fd1d1]">{item.label}：</span>
              <span className="text-lg text-slate-200 font-mono font-medium">{item.value}</span>
            </div>
          ))}
        </div>

        {/* 右側：円グラフ */}
        <div className="flex-1 h-[300px] lg:h-auto min-h-[300px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={user.id}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1d2b", border: "1px solid #334155", borderRadius: "8px" }}
                itemStyle={{ color: "#4fd1d1" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* データがない場合のガード */}
          {user.clearPlayCount + user.failurePlayCount + user.interruptPlayCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm bg-[#1a1d2b]/50">
              NO DATA
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
