"use client";

import { PieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
import { UserDetailResponse } from "@/app/_types";

interface UserStatsCardProps {
  user: UserDetailResponse;
}

export function UserStatsCard({ user }: UserStatsCardProps) {
  // 円グラフ
  const chartData = [
    { name: "踏破ダンジョン", value: user.uniqueClearDungeonCount, fill: "#34d399" },
    { name: "失敗ダンジョン", value: user.uniqueFailureDungeonCount, fill: "#f87171" },
    { name: "中断ダンジョン", value: user.uniqueInterruptDungeonCount, fill: "#fbbf24" },
  ];

  // ダンジョン攻略状況
  const uniqueStats = [
    { label: "挑戦ダンジョン数", value: user.playDungeonCount, color: "#4fd1d1" },
    { label: "踏破ダンジョン数", value: user.uniqueClearDungeonCount, color: "#34d399" },
    { label: "失敗ダンジョン数", value: user.uniqueFailureDungeonCount, color: "#f87171" },
    { label: "中断ダンジョン数", value: user.uniqueInterruptDungeonCount, color: "#fbbf24" },
  ];

  // プレイ実績（累計系）
  const totalStats = [
    { label: "トータルプレイ回数", value: user.totalPlayCount, color: "#94a3b8" },
    { label: "ダンジョン踏破回数", value: user.totalClearPlayCount, color: "#94a3b8" },
    { label: "ダンジョン失敗回数", value: user.totalFailurePlayCount, color: "#94a3b8" },
    { label: "ダンジョン中断回数", value: user.totalInterruptPlayCount, color: "#94a3b8" },
  ];

  const topMetrics = [
    { label: "総合ランキング", value: `#${user.rank ? user.rank : "---"}`, unit: "" },
    { label: "トータルスコア", value: user.totalPlayScore.toLocaleString(), unit: "pt" },
    { label: "トータル時間", value: user.totalPlayTime.toLocaleString(), unit: "sec" },
  ];

  const totalUniqueCount =
    user.uniqueClearDungeonCount + user.uniqueFailureDungeonCount + user.uniqueInterruptDungeonCount;

  return (
    <div className="bg-[#1a1d2b] border border-slate-700/80 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl h-full flex flex-col justify-between">
      {/* 上部：ハイライトメトリクス */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-6">
        {topMetrics.map((metric, idx) => (
          <div
            key={idx}
            className={`bg-slate-800/40 rounded-xl p-3 sm:p-3.5 border border-slate-700/60 flex flex-col justify-center items-center text-center ${
              idx === 2 ? "col-span-2 sm:col-span-1" : "col-span-1"
            }`}
          >
            <span className="text-[#4fd1d1] font-mono text-[10px] sm:text-xs tracking-wider uppercase mb-1 whitespace-nowrap">
              {metric.label}
            </span>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white font-mono leading-tight whitespace-nowrap">
              {metric.value}
              {metric.unit && (
                <span className="text-xs sm:text-sm font-normal text-slate-400 ml-0.5">{metric.unit}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* 下部：数値リスト & 円グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1">
        {/* 左：数値リスト */}
        <div className="lg:col-span-7 space-y-4 min-w-0">
          {/* ユニーク系セクション */}
          <div className="space-y-2">
            <div className="text-[10px] sm:text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5 border-b border-slate-700/60 pb-1 flex items-center justify-between">
              <span>ダンジョン攻略状況</span>
            </div>
            {uniqueStats.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-slate-700/30 pb-1.5 gap-2">
                <span style={{ color: item.color }} className="text-xs sm:text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
                <span className="text-base sm:text-lg text-slate-100 font-mono font-semibold shrink-0">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* 累計系セクション */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[9px] sm:text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 border-b border-slate-700/40 pb-1">
              プレイ実績 (累計)
            </div>
            {totalStats.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-slate-700/20 pb-1 gap-2">
                <span style={{ color: item.color }} className="text-[11px] sm:text-xs whitespace-nowrap font-normal">
                  {item.label}
                </span>
                <span className="text-sm sm:text-base text-slate-200 font-mono font-medium shrink-0">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 右：円グラフ ＆ 凡例 */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="h-[180px] sm:h-[210px] lg:h-[230px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart key={user.id}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="80%"
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

            {totalUniqueCount === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-mono bg-[#1a1d2b]/60 rounded-xl">
                データなし
              </div>
            )}
          </div>

          {/* カラー凡例 */}
          {totalUniqueCount > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-2 text-[11px] font-mono text-slate-300">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
