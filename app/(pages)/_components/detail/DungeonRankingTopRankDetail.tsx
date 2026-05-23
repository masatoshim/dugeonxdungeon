import Image from "next/image";
import { Crown } from "lucide-react";
import { DungeonRankingEntry } from "@/types";
import { useProfileIcon } from "@/app/_hooks";

interface Props {
  key: number;
  entry: DungeonRankingEntry;
}

export function DungeonRankingTopRankDetail({ entry }: Props) {
  const { iconUrl } = useProfileIcon(entry.user.iconImageKey);

  return (
    <div
      key={entry.rank}
      className="bg-slate-900/40 rounded-lg px-4 py-2.5 flex items-center justify-between border border-slate-800/50 transition-hover hover:bg-slate-800/60"
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-slate-500 text-sm w-5">{entry.rank}</span>
        {iconUrl ? (
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-700 shrink-0">
            <Image src={iconUrl} alt="avatar" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
            <span className="text-[16px] font-bold leading-none">☺</span>
          </div>
        )}
        <span className="text-sm text-slate-300 font-medium">{entry.user.nickName}</span>
      </div>
      <span className="text-xs font-mono text-slate-400">{entry.playScore.toLocaleString()} pt</span>
    </div>
  );
}
