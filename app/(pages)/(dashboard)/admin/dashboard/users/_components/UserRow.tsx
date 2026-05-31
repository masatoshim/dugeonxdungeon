"use client";

import { useRouter } from "next/navigation";
import { Maximize, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserResponse, DungeonsIndexResponse } from "@/types";
import { DungeonStatus } from "@prisma/client";
import { KeyedMutator } from "swr";
import { useProfileIcon } from "@/app/_hooks";
import Image from "next/image";

interface UserRowProps {
  displayRank: number;
  user: UserResponse;
}

export function UserRow({ displayRank, user }: UserRowProps) {
  const router = useRouter();
  const { iconUrl } = useProfileIcon(user?.iconImageKey);

  // スコアのカンマ区切り＋pt整形
  const formatScore = (score: number) => {
    return `${score.toLocaleString()} pt`;
  };

  // プレイ時間の整形
  const formatPlayTime = (seconds: number) => {
    return `${seconds.toLocaleString()} sec`;
  };

  return (
    <div
      className={`relative flex items-center gap-6 p-4 rounded-xl border transition-all duration-1000 animate-highlight border-[#4fd1d1] z-10 shadow-[0_0_15px_rgba(79,209,209,0.2)]`}
    >
      {/* ユーザー情報 */}
      <span className="py-4 px-6 text-center font-mono text-base font-black text-indigo-400">{displayRank}</span>

      <span className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#4fd1d1]/20 bg-slate-800  items-center justify-center relative">
        {iconUrl ? (
          <Image src={iconUrl} alt="avatar" width={12} height={12} className="object-cover w-full h-full" unoptimized />
        ) : (
          <span className="text-slate-10 text-xs text-center p-2">No Image</span>
        )}
      </span>

      <span className="text-gray-400 font-mono text-xs w-24 shrink-0">{user.userName}</span>
      <span className="flex-1 font-bold text-white truncate">{user.nickName}</span>

      <span className="py-4 px-6 text-right text-[#e2d4be] font-mono">{formatScore(user.totalPlayScore)}</span>
      <span className="py-4 px-6 text-right text-[#e2d4be] font-mono">{formatPlayTime(user.totalPlayTime)}</span>
      <span className="py-4 px-6 text-center text-[#e2d4be] font-mono text-base">{user.dungeonCount}</span>
      {/* 操作ボタン群 */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => router.push(`/admin/dashboard/users/${user.id}`)}
          className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-1.5 rounded text-xs font-bold transition-all shadow-sm"
        >
          詳細
        </button>
      </div>
    </div>
  );
}
