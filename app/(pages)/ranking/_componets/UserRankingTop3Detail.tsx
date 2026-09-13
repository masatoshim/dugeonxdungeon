"use client";

import Image from "next/image";
import { useProfileIcon } from "@/app/_hooks";
import { UserResponse } from "@/app/_types";

interface UserRankingTop3DetailPageProps {
  user: UserResponse;
  index: number;
}

export function UserRankingTop3Detail({ user, index }: UserRankingTop3DetailPageProps) {
  const { iconUrl } = useProfileIcon(user.iconImageKey);

  // 1〜3位のパネル用スタイルマッピング
  const rankStyles = [
    {
      bg: "bg-gradient-to-br from-amber-300/20 via-amber-500/40 to-amber-600/20 border-amber-500/50",
      text: "text-amber-400",
      badge: "1st",
    },
    {
      bg: "bg-gradient-to-br from-slate-300/20 via-slate-400/40 to-slate-500/20 border-slate-400/50",
      text: "text-slate-300",
      badge: "2nd",
    },
    {
      bg: "bg-gradient-to-br from-amber-700/20 via-amber-800/40 to-amber-900/20 border-amber-800/50",
      text: "text-amber-600",
      badge: "3rd",
    },
  ];
  const style = rankStyles[index] || rankStyles[0];

  return (
    <div
      key={user.id}
      className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 backdrop-blur-sm relative overflow-hidden max-w-xl mx-auto w-full ${style.bg}`}
    >
      {/* 左側：大きなアイコンと順位バッジ */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <div className="relative w-20 h-20 bg-slate-900/80 rounded-full border border-slate-800 flex items-center justify-center overflow-hidden">
          {iconUrl ? (
            <div className="relative w-20 h-20 bg-slate-900/80 rounded-full border border-slate-800 flex items-center justify-center overflow-hidden">
              <Image src={iconUrl} alt={user.nickName ?? "avatar"} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl">😊</div>
          )}
        </div>
        <span className={`text-xl font-black font-mono tracking-tighter ${style.text}`}>{style.badge}</span>
      </div>
      {/* メタ情報エリア */}
      <div className="flex-1 w-full min-w-0 space-y-2 text-xs">
        <h2 className="text-base font-black truncate text-white mb-2 text-center sm:text-left">{user.nickName}</h2>

        <div className="grid grid-cols-1 min-[300px]:grid-cols-2 items-center text-slate-400 gap-0.5 min-[300px]:gap-4">
          <span className="text-[11px]">トータルスコア:</span>
          <span className="font-bold text-slate-200 text-right text-sm">
            {user.totalPlayScore.toLocaleString()}
            <span className="text-[10px] text-slate-400 font-normal ml-1">pt</span>
          </span>
        </div>

        <div className="grid grid-cols-1 min-[300px]:grid-cols-2 items-center text-slate-400 gap-0.5 min-[300px]:gap-4">
          <span className="text-[11px]">プレイ回数:</span>
          <span className="font-bold text-slate-200 text-right text-sm">{user.totalPlayCount.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-1 min-[300px]:grid-cols-2 items-center text-slate-400 gap-0.5 min-[300px]:gap-4">
          <span className="text-[11px]">ダンジョン踏破数:</span>
          <span className="font-bold text-slate-200 text-right text-sm">{user.clearPlayCount.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-1 min-[300px]:grid-cols-2 items-center text-slate-400 gap-0.5 min-[300px]:gap-4">
          <span className="text-[11px]">トータルプレイ時間:</span>
          <span className="font-bold text-slate-200 text-right text-sm">
            {(() => {
              const [integer, decimal] = user.totalPlayTime.toLocaleString().split(".");
              return (
                <>
                  {integer}
                  {decimal && <span className="text-[10px]">.{decimal}</span>}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">sec</span>
                </>
              );
            })()}
          </span>
        </div>
      </div>
    </div>
  );
}
