"use client";

import { useState } from "react";
import { Heart, CheckSquare } from "lucide-react";
import { DungeonResponse } from "@/types";
import Link from "next/link";

interface DungeonCardProps {
  dungeon: DungeonResponse;
  isCleared?: boolean;
  onFavoriteToggle?: (id: string) => void;
}

export function DungeonCard({ dungeon, isCleared = false, onFavoriteToggle }: DungeonCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavoriteToggle?.(dungeon.id);
  };

  return (
    <Link href={`/dungeons/${dungeon.id}`} scroll={false}>
      <div className="group relative bg-[#1a233a] border border-slate-700 rounded-xl p-5 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all hover:-translate-y-1 cursor-pointer">
        {/* ヘッダーセクション */}
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-mono text-slate-400 tracking-wider">{dungeon.code}</span>

          <div className="flex items-center gap-3">
            {/* お気に入り */}
            <button
              onClick={handleFavoriteClick}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-colors ${
                isFavorited ? "bg-pink-500/20 text-pink-500" : "bg-slate-800 text-slate-400 hover:text-pink-400"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
              <span className="font-medium">1,234</span>
            </button>

            {/* クリア済みチェック */}
            <div className={`${isCleared ? "text-blue-400" : "text-slate-600"}`}>
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* メイン情報 */}
        <h3 className="text-2xl font-black text-white mb-1 truncate group-hover:text-blue-400 transition-colors">
          {dungeon.name}
        </h3>

        {renderDifficulty(dungeon.difficulty || 2)}

        <div className="space-y-1 mt-4 text-sm text-slate-300">
          <p className="flex justify-between">
            <span className="text-slate-500">ダンジョンサイズ</span>
            <span className="font-mono">
              {dungeon.mapSizeWidth} x {dungeon.mapSizeHeight}
            </span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500">制限時間</span>
            <span className="font-mono text-amber-400">{dungeon.timeLimit}sec</span>
          </p>
        </div>

        {/* 説明文 */}
        <p className="mt-4 text-sm text-slate-400 line-clamp-2 min-h-[2.5rem] italic">
          {dungeon.description || "説明文はありません。"}
        </p>

        {/* フッター（作成者情報） */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white overflow-hidden border border-slate-700">
            {/* プロフィール画像がある場合はimgを表示 */}
            <span className="text-xs font-bold leading-none">☺</span>
          </div>
          <span className="text-sm font-bold text-slate-200 uppercase tracking-tight">
            {dungeon.nickName || "USER_NAME"}
          </span>
        </div>
      </div>
    </Link>
  );
}
