"use client";

import { PieChart, Pie, ResponsiveContainer } from "recharts";

const COLORS = ["#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#450a0a"];

interface StatPeriod {
  name: string;
  count: number;
}

interface AdminStatsOverviewProps {
  userStats: {
    total: number;
    periods: StatPeriod[];
  };
  dungeonStats: {
    total: number;
    periods: StatPeriod[];
    adminCount: number;
  };
}

export function AdminStatsOverview({ userStats, dungeonStats }: AdminStatsOverviewProps) {
  const userChartData = userStats.periods.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  const dungeonChartData = [
    ...dungeonStats.periods,
    { name: "管理者ダンジョン数:", count: dungeonStats.adminCount },
  ].map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="w-full bg-[#1a1d2b] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl grid grid-cols-1 xl:grid-cols-2 gap-8 text-slate-300">
      {/* 左側：ユーザー数 */}
      <div className="flex flex-col justify-between bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
        {/* 上部ヘッダー */}
        <div className="flex justify-between items-center bg-[#101422] border border-slate-700/60 px-4 py-2.5 rounded-lg w-full max-w-[240px] mb-6">
          <span className="text-xs sm:text-sm font-bold text-[#4fd1d1]">ユーザー数</span>
          <span className="text-lg sm:text-xl font-mono font-bold text-white">{userStats.total}</span>
        </div>

        <p className="text-xs sm:text-sm font-bold text-[#4fd1d1] mb-4">直近ログインユーザー数</p>

        {/* 数値リスト + 円グラフ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* リスト */}
          <div className="space-y-2 font-mono text-xs sm:text-sm w-full sm:flex-1">
            {userStats.periods.map((period, index) => (
              <div key={index} className="flex justify-between items-center border-b border-slate-700/30 pb-1">
                <span className="text-slate-400">{period.name}</span>
                <span className="text-white font-bold">{period.count}</span>
              </div>
            ))}
          </div>

          {/* 円グラフ */}
          <div className="w-36 h-36 sm:w-40 sm:h-40 shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={65}
                  dataKey="count"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 右側：ダンジョン数 */}
      <div className="flex flex-col justify-between bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
        {/* 上部ヘッダー */}
        <div className="flex justify-between items-center bg-[#101422] border border-slate-700/60 px-4 py-2.5 rounded-lg w-full max-w-[240px] mb-6">
          <span className="text-xs sm:text-sm font-bold text-[#4fd1d1]">ダンジョン数</span>
          <span className="text-lg sm:text-xl font-mono font-bold text-white">{dungeonStats.total}</span>
        </div>

        <p className="text-xs sm:text-sm font-bold text-[#4fd1d1] mb-4">ユーザー新規作成ダンジョン数</p>

        {/* 数値リスト + 円グラフ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* リスト */}
          <div className="space-y-2 font-mono text-xs sm:text-sm w-full sm:flex-1">
            {dungeonStats.periods.map((period, index) => (
              <div key={index} className="flex justify-between items-center border-b border-slate-700/30 pb-1">
                <span className="text-slate-400">{period.name}</span>
                <span className="text-white font-bold">{period.count}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-slate-700 mt-2">
              <span className="text-[#4fd1d1] font-bold">管理者ダンジョン数 :</span>
              <span className="text-white font-bold">{dungeonStats.adminCount}</span>
            </div>
          </div>

          {/* 円グラフ */}
          <div className="w-36 h-36 sm:w-40 sm:h-40 shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dungeonChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={65}
                  dataKey="count"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
