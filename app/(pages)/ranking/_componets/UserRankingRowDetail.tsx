"use client";

import Image from "next/image";
import { UserResponse } from "@/app/_types";
import { useProfileIcon } from "@/app/_hooks";

interface UserRankingRowDetailProps {
  user: UserResponse;
  rank: number;
}

export function UserRankingRowDetail({ user, rank }: UserRankingRowDetailProps) {
  const { iconUrl } = useProfileIcon(user.iconImageKey);

  const formatScore = (score: number) => score.toLocaleString() + " pt";
  const formatTime = (seconds: number) => seconds.toLocaleString() + " sec";

  return (
    <tr className="hover:bg-slate-800/30 transition-colors group">
      {/* 順位 */}
      <td className="py-3.5 px-6 text-center font-mono font-black text-slate-400 text-sm group-hover:text-cyan-400 transition-colors">
        {rank}
      </td>

      {/* ユーザー名・アイコン画像 */}
      <td className="py-3.5 px-6 font-bold text-slate-200">
        <div className="flex items-center gap-3">
          {iconUrl ? (
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-slate-800 shrink-0">
              <Image src={iconUrl} alt={user.nickName ?? "avatar"} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs shrink-0 select-none">
              😊
            </div>
          )}
          <span className="truncate max-w-[160px]">{user.nickName}</span>
        </div>
      </td>

      {/* トータルスコア */}
      <td className="py-3.5 px-6 text-right font-mono font-bold text-amber-400/90">
        {formatScore(user.totalPlayScore)}
      </td>

      {/* プレイ回数 */}
      <td className="py-3.5 px-6 text-right font-mono text-slate-300">{user.totalPlayCount}</td>

      {/* ダンジョン踏破数 */}
      <td className="py-3.5 px-6 text-right font-mono text-slate-300">{user.clearPlayCount}</td>

      {/* トータルプレイ時間 */}
      <td className="py-3.5 px-6 text-right font-mono text-slate-400">{formatTime(user.totalPlayTime)}</td>
    </tr>
  );
}
