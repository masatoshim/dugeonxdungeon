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
    <div className="w-full bg-slate-900/60 border border-slate-700/50 rounded-3xl p-8 shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-12 text-slate-300">
      {/* 左側：ユーザー数コンポーネント */}
      <div className="flex flex-col justify-between">
        <div className="flex justify-between items-center bg-[#1a233a] border border-slate-700/60 px-4 py-2 rounded-md max-w-[240px] mb-6">
          <span className="text-sm font-bold text-[#4fd1d1]">ユーザー数</span>
          <span className="text-lg font-mono font-bold text-white">{userStats.total}</span>
        </div>

        <p className="text-sm font-bold text-[#4fd1d1] mb-4">直近ログインユーザー数</p>

        <div className="flex items-center justify-start gap-25">
          <div className="space-y-2 font-mono text-sm min-w-[200px]">
            {userStats.periods.map((period, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-[#4fd1d1]/90">{period.name}</span>
                <span className="text-white font-bold">{period.count}</span>
              </div>
            ))}
          </div>

          {/* 円グラフ */}
          <div className="w-[160px] h-[160px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
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

      {/* 右側：ダンジョン数コンポーネント */}
      <div className="flex flex-col justify-between">
        <div className="flex justify-between items-center bg-[#1a233a] border border-slate-700/60 px-4 py-2 rounded-md max-w-[240px] mb-6">
          <span className="text-sm font-bold text-[#4fd1d1]">ダンジョン数</span>
          <span className="text-lg font-mono font-bold text-white">{dungeonStats.total}</span>
        </div>

        <p className="text-sm font-bold text-[#4fd1d1] mb-4">ユーザー新規作成ダンジョン数</p>

        <div className="flex items-center justify-start gap-25">
          <div className="space-y-2 font-mono text-sm min-w-[200px]">
            {dungeonStats.periods.map((period, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-[#4fd1d1]/90">{period.name}</span>
                <span className="text-white font-bold">{period.count}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 mt-1">
              <span className="text-[#4fd1d1] font-bold">管理者ダンジョン数 :</span>
              <span className="text-white font-bold">{dungeonStats.adminCount}</span>
            </div>
          </div>

          {/* 円グラフ */}
          <div className="w-[160px] h-[160px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dungeonChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
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
