import Image from "next/image";
import { Crown } from "lucide-react";
import { DungeonRankingEntry } from "@/types";
import { useProfileIcon } from "@/app/_hooks";

interface Props {
  entry: DungeonRankingEntry;
}

export function DungeonRankingTop3Detail({ entry }: Props) {
  const { iconUrl } = useProfileIcon(entry.user.iconImageKey);

  return (
    <div className="space-y-4">
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
            <div className="flex items-center gap-3">
              {iconUrl ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-700 shrink-0">
                  <Image src={iconUrl} alt="avatar" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <span className="text-[16px] font-bold leading-none">☺</span>
                </div>
              )}
              <span className="font-bold text-lg text-white">{entry.user.nickName}</span>
            </div>
            <span className="text-blue-400 font-mono font-bold">
              {entry.playScore.toLocaleString()} <span className="text-[10px] text-slate-500">pt</span>
            </span>
          </div>
          <div className="text-right text-xs text-slate-400 font-mono">
            CLEAR TIME: <span className="text-slate-200">{entry.clearTime}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
