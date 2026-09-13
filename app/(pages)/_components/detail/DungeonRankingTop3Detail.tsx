import Image from "next/image";
import { Crown } from "lucide-react";
import { DungeonRankingEntry } from "@/app/_types";
import { useProfileIcon } from "@/app/_hooks";

interface Props {
  key: number;
  entry: DungeonRankingEntry;
}

export function DungeonRankingTop3Detail({ entry }: Props) {
  const { iconUrl } = useProfileIcon(entry.user.iconImageKey);

  return (
    <div className="space-y-4">
      <div
        key={entry.rank}
        className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border border-slate-700 shadow-lg w-full min-w-0"
      >
        {/* 王冠と順位 */}
        <div className="flex flex-col items-center justify-center w-10 shrink-0">
          <Crown
            className={`w-7 h-7 sm:w-8 sm:h-8 ${
              entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-slate-300" : "text-amber-600"
            }`}
          />
          <span className="text-[10px] sm:text-xs font-bold text-white uppercase">No.{entry.rank}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* ユーザー情報 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 mb-1">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {iconUrl ? (
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-slate-700 shrink-0">
                  <Image src={iconUrl} alt="avatar" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-bold leading-none">☺</span>
                </div>
              )}
              <span className="font-bold text-sm sm:text-base text-white truncate min-w-[100px]">
                {entry.user.nickName}
              </span>
            </div>

            {/* スコア */}
            <span className="text-blue-400 font-mono font-bold text-xs sm:text-sm shrink-0 pl-11 sm:pl-0">
              {entry.playScore.toLocaleString()} <span className="text-[10px] text-slate-500">pt</span>
            </span>
          </div>

          {/* クリアタイム */}
          <div className="text-right text-[11px] sm:text-xs text-slate-400 font-mono">
            クリアタイム：{" "}
            <span className="text-slate-200">
              {(() => {
                const [intPart, decimalPart] = entry.clearTime.toString().split(".");
                return (
                  <>
                    <span className="text-sm sm:text-base font-bold">{intPart}</span>
                    {decimalPart && <span className="text-[10px] sm:text-xs text-slate-400">.{decimalPart}</span>}
                    <span className="text-xs sm:text-sm font-semibold ml-0.5">s</span>
                  </>
                );
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
