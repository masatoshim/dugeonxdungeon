"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Heart, CheckSquare } from "lucide-react";
import { DungeonResponse, FavoriteDungeonResponse } from "@/types";
import { useGetFavoriteDungeon, useCreateFavoriteDungeon, useDeleteFavoriteDungeon } from "@/app/_hooks";
import Link from "next/link";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

interface DungeonCardProps {
  dungeon: DungeonResponse;
  isCleared?: boolean;
}

export function DungeonCard({ dungeon, isCleared = false }: DungeonCardProps) {
  const { status } = useSession();
  const { isFavorited, mutate } = useGetFavoriteDungeon(dungeon.id);
  const [favoritesCount, setFavoritesCount] = useState(dungeon.favoritesCount);
  const { create, isCreating } = useCreateFavoriteDungeon(dungeon.id);
  const { remove, isDeleting } = useDeleteFavoriteDungeon(dungeon.id);

  const pathname = usePathname();
  // 現在のパスが /favorites や /history なら、その下に ID をつける
  // /dungeons (一覧) なら /dungeons/[id] にする
  const detailHref = pathname.includes(dungeon.id) ? pathname : `${pathname.replace(/\/$/, "")}/${dungeon.id}`;

  // 難易度
  const renderDifficulty = (difficulty: number) => {
    return (
      <div className="flex gap-0.5 my-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-lg ${i < difficulty ? "text-yellow-400" : "text-gray-600"}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Link の遷移を防止
    e.stopPropagation(); // バブリングを防止

    if (status !== "authenticated") {
      toast.error("お気に入り登録にはログインが必要です");
      return;
    }

    if (isCreating || isDeleting) return;
    try {
      let result: FavoriteDungeonResponse;
      if (isFavorited) {
        result = await remove(dungeon.id);
      } else {
        result = await create(dungeon.id);
      }
      setFavoritesCount(result.count);
      mutate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Link href={`?dungeonId=${dungeon.id}`} scroll={false}>
      <div className="group relative max-w-[320px] bg-[#1a233a] border border-slate-700 rounded-lg p-2.5 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all hover:-translate-y-1 cursor-pointer">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-1.5">
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">{dungeon.code}</span>
          <div className="flex items-center gap-2">
            {/* お気に入り */}
            <button
              onClick={handleFavoriteClick}
              className={`flex items-center gap-1 px-1.5 py-0 rounded-full text-[11px] transition-colors ${
                isFavorited ? "bg-pink-500/20 text-pink-500" : "bg-slate-800 text-slate-400 hover:text-pink-400"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-current" : ""}`} />
              <span className="font-medium">{favoritesCount}</span>
            </button>
            {/* クリア済みチェック */}
            <div className={`${isCleared ? "text-blue-400" : "text-slate-600"}`}>
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* ダンジョンタイトル */}
        <h3 className="text-lg font-black text-white mb-0.5 truncate group-hover:text-blue-400 transition-colors">
          {dungeon.name}
        </h3>

        {/* 難易度星アイコン */}
        <div className="scale-90 origin-left -mb-1">{renderDifficulty(dungeon.difficulty || 2)}</div>

        {/* ダンジョンサイズ & 制限時間 */}
        <div className="space-y-0.5 mt-2 text-[11px] text-slate-300">
          <p className="flex justify-start gap-2">
            <span className="text-slate-500 w-20">サイズ</span>
            <span className="font-mono">
              {dungeon.mapSizeWidth} x {dungeon.mapSizeHeight}
            </span>
          </p>
          <p className="flex justify-start gap-2">
            <span className="text-slate-500 w-20">制限時間</span>
            <span className="font-mono text-amber-400">{dungeon.timeLimit}sec</span>
          </p>
        </div>

        {/* 説明文 */}
        <p className="mt-1.5 text-[12px] leading-tight font-light text-slate-500 line-clamp-2 italic">
          {dungeon.description || "説明文はありません。"}
        </p>

        {/* フッター */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/50 flex justify-end items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white overflow-hidden border border-slate-700">
            <span className="text-[9px] font-bold leading-none">☺</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
            {dungeon.nickName || "USER_NAME"}
          </span>
        </div>
      </div>
    </Link>
  );
}
