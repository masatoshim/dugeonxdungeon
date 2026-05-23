import { Crown, User } from "lucide-react";
import { DungeonRankingEntry, MyDungeonRecord } from "@/types";
import { DungeonRankingTop3Detail } from "./DungeonRankingTop3Detail";
import { DungeonRankingTopRankDetail } from "./DungeonRankingTopRankDetail";

interface Props {
  rankings: DungeonRankingEntry[];
  myRecord?: MyDungeonRecord | null;
}

export function DungeonRankingPanel({ rankings, myRecord }: Props) {
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
            <DungeonRankingTop3Detail key={entry.rank} entry={entry} />
          ))}
        </div>

        {/* 右側：Top 4-10 (リスト表示) */}
        <div className="flex flex-col gap-2">
          {rest.map((entry) => (
            <DungeonRankingTopRankDetail key={entry.rank} entry={entry} />
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
                  <div className="text-xs font-mono text-blue-300">{myRecord.playScore.toLocaleString()} pt</div>
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
