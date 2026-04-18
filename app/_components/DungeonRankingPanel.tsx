import { Crown, User } from "lucide-react";

interface RankingEntry {
  user: { nickName: string; image?: string };
  score: number;
  clearTime: number;
  rank: number;
}

interface Props {
  rankings: RankingEntry[];
  myRecord?: RankingEntry | null;
}

export default function DungeonRankingPanel({ rankings, myRecord }: Props) {
  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3, 10);

  return (
    <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 shadow-inner">
      <h3 className="text-center text-yellow-400 text-xl font-black mb-6 tracking-widest">
        🏆 ダンジョンランキング 🏆
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側：Top 3 (リッチ表示) */}
        <div className="space-y-4">
          {top3.map((entry) => (
            <div
              key={entry.rank}
              className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 flex items-center gap-4 border border-slate-700 shadow-lg"
            >
              <div className="flex flex-col items-center justify-center w-10">
                <Crown
                  className={`w-8 h-8 ${entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-slate-300" : "text-amber-600"}`}
                />
                <span className="text-xs font-bold text-white uppercase">No.{entry.rank}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-lg text-white">{entry.user.nickName}</span>
                  <span className="text-blue-400 font-mono font-bold">
                    {entry.score.toLocaleString()} <span className="text-[10px] text-slate-500">pt</span>
                  </span>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono">
                  CLEAR TIME: <span className="text-slate-200">{entry.clearTime}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 右側：Top 4-10 (リスト表示) */}
        <div className="flex flex-col gap-2">
          {rest.map((entry) => (
            <div
              key={entry.rank}
              className="bg-slate-900/40 rounded-lg px-4 py-2.5 flex items-center justify-between border border-slate-800/50 transition-hover hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-500 text-sm w-5">{entry.rank}</span>
                <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                  {/* <img src={entry.user.image} /> */}
                </div>
                <span className="text-sm text-slate-300 font-medium">{entry.user.nickName}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{entry.score.toLocaleString()} pt</span>
            </div>
          ))}

          {/* 自分の順位 (MyRankBadge をパネル内に統合) */}
          {myRecord && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Your Best
                  </div>
                  <span className="text-sm font-bold text-blue-200">{myRecord.rank}位</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-blue-300">{myRecord.score.toLocaleString()} pt</div>
                  <div className="text-[10px] text-slate-500 font-mono">{myRecord.clearTime}s</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
