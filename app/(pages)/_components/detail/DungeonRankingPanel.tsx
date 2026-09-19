import { Crown, User } from "lucide-react";
import { DungeonRankingEntry, MyDungeonRecord } from "@/app/_types";
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
    <div className="bg-slate-800/40 rounded-2xl p-4 sm:p-6 border border-slate-700/50 shadow-inner w-full min-w-0">
      <h3 className="text-center text-yellow-400 text-xs sm:text-sm font-black mb-4 sm:mb-6 tracking-widest uppercase truncate px-2">
        🏆 ダンジョンランキング 🏆
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* 左側：Top 3 (リッチ表示) */}
        <div className="space-y-3 sm:space-y-4 min-w-0">
          {top3.map((entry) => (
            <DungeonRankingTop3Detail key={entry.rank} entry={entry} />
          ))}
        </div>

        {/* 右側：Top 4-10 (リスト表示) */}
        <div className="flex flex-col gap-2 min-w-0">
          {rest.map((entry) => (
            <DungeonRankingTopRankDetail key={entry.rank} entry={entry} />
          ))}

          {/* 自分の順位 (MyRankBadge をパネル内に統合) */}
          {myRecord && (
            <div className="mt-2 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700/50">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0">
                    あなたの順位
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-blue-200 truncate">{myRecord.rank}位</span>
                </div>
                <div className="text-right shrink-0">
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
