"use client";

import { PieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
import { UserResponse } from "@/app/_types";

interface UserStatsCardProps {
  user: UserResponse;
}

export function UserStatsCard({ user }: UserStatsCardProps) {
  const chartData = [
    { name: "踏破", value: user.clearPlayCount, fill: "#ef4444" },
    { name: "失敗", value: user.failurePlayCount, fill: "#b91c1c" },
    { name: "中断", value: user.interruptPlayCount, fill: "#7f1d1d" },
  ];

  const statItems = [
    { label: "トータルプレイ回数", value: user.totalPlayCount },
    { label: "挑戦ダンジョン数", value: user.playDungeonCount },
    { label: "踏破済みダンジョン数", value: user.clearPlayCount },
    { label: "失敗ダンジョン数", value: user.failurePlayCount },
    { label: "中断ダンジョン数", value: user.interruptPlayCount },
    { label: "マイダンジョン数", value: user.dungeonCount },
    { label: "公開済みダンジョン数", value: user.publishedDungeonCount },
  ];

  const topMetrics = [
    { label: "総合ランキング", value: `#${user.rank ? user.rank : "---"}`, unit: "" },
    { label: "トータルスコア", value: user.totalPlayScore.toLocaleString(), unit: "pt" },
    { label: "トータル時間", value: user.totalPlayTime.toLocaleString(), unit: "sec" },
  ];

  return (
    <div className="bg-[#1a1d2b] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl h-full flex flex-col justify-between">
      {/* 上部：ハイライトメトリクス */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {topMetrics.map((metric, idx) => (
          <div
            key={idx}
            className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/60 flex flex-col justify-center items-center text-center"
          >
            <span className="text-[#4fd1d1] text-[10px] font-mono tracking-widest uppercase mb-1">{metric.label}</span>
            <span className="text-xl sm:text-2xl font-bold text-white font-mono leading-tight truncate w-full">
              {metric.value}{" "}
              {metric.unit && <span className="text-xs font-normal text-slate-400 ml-0.5">{metric.unit}</span>}
            </span>
          </div>
        ))}
      </div>

      {/* 下部：数値リスト & 円グラフ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center flex-1">
        {/* 左：数値リスト */}
        <div className="xl:col-span-7 space-y-2.5">
          {statItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between border-b border-slate-700/40 pb-1.5">
              <span className="text-xs sm:text-sm text-[#4fd1d1]">{item.label}</span>
              <span className="text-base sm:text-lg text-slate-100 font-mono font-semibold">{item.value}</span>
            </div>
          ))}
        </div>

        {/* 右：円グラフ */}
        <div className="xl:col-span-5 h-[220px] sm:h-[260px] w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={user.id}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1d2b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#4fd1d1" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* データがない場合のガード */}
          {user.clearPlayCount + user.failurePlayCount + user.interruptPlayCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-mono bg-[#1a1d2b]/60 rounded-xl">
              NO DATA
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
