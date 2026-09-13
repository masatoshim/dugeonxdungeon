import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Maximize, Clock, Footprints, LogOut, Timer, Star, Play } from "lucide-react";
import { DungeonResponse, FavoriteDungeonResponse } from "@/app/_types";
import { useSession } from "next-auth/react";
import {
  useProfileIcon,
  useGetFavoriteDungeonStatus,
  useCreateFavoriteDungeon,
  useDeleteFavoriteDungeon,
} from "@/app/_hooks";
import { toast } from "sonner";

interface DungeonInfoProps {
  dungeon: DungeonResponse;
  isCleared: boolean;
  targetPage: number;
}

export function DungeonInfoSection({ dungeon, isCleared, targetPage }: DungeonInfoProps) {
  const router = useRouter();
  const { status } = useSession();
  const { isFavorited, mutate } = useGetFavoriteDungeonStatus(dungeon.id);
  const [favoritesCount, setFavoritesCount] = useState(dungeon.favoritesCount);
  const { create, isCreating } = useCreateFavoriteDungeon(dungeon.id);
  const { remove, isDeleting } = useDeleteFavoriteDungeon(dungeon.id);
  const { iconUrl } = useProfileIcon(dungeon.userIconImageKey);

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

  // スタッツ項目を配列化してループで表示
  const stats = [
    { icon: Maximize, label: "ダンジョンサイズ", value: `${dungeon.mapSizeHeight} x ${dungeon.mapSizeWidth}` },
    { icon: Clock, label: "制限時間", value: `${dungeon.timeLimit}sec` },
    { icon: Footprints, label: "挑戦者の足跡", value: `${dungeon.totalPlayCount}回` },
    { icon: LogOut, label: "帰還者の足跡", value: `${dungeon.clearPlayCount}人` },
    { icon: Timer, label: "平均踏破時間", value: `${dungeon.averageClearTime ?? "--"}sec` },
  ];

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    // プレイ後の遷移ページを設定
    sessionStorage.setItem("dungeon_list_return_url", `/dungeons/?page=${targetPage}`);

    // プレイ画面へ遷移
    router.push(`/dungeons/${dungeon.id}/play`);
  };

  return (
    <div className="text-white space-y-4">
      {/* ユーザー情報 & お気に入り・攻略状況 */}
      <div className="flex flex-wrap justify-between items-center gap-y-3 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold border border-indigo-400 overflow-hidden shrink-0">
            {iconUrl ? (
              <Image
                src={iconUrl}
                alt="avatar"
                width={30}
                height={30}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <span className="text-[9px] font-bold leading-none">☺</span>
            )}
          </div>
          <span className="font-bold text-slate-200">{dungeon.nickName}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFavoriteClick}
            className={`flex items-center gap-1 px-1.5 py-0 rounded-full text-[11px] transition-colors ${
              isFavorited ? "bg-pink-500/20 text-pink-500" : "bg-slate-800 text-slate-400 hover:text-pink-400"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-current" : ""}`} />
            <span>お気に入り</span>
            <span className="bg-white/20 px-2 rounded ml-1">{favoritesCount}</span>
          </button>

          <div
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isCleared
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-slate-700/50 text-slate-400 border border-slate-600"
            }`}
          >
            {isCleared ? "攻略済み" : "未攻略"}
          </div>
        </div>
      </div>

      {/* タイトル & 難易度 & プレイボタン */}
      <div>
        <div className="text-slate-500 font-mono text-sm mb-1">{dungeon.code}</div>
        <h2 className="text-2xl sm:text-2xl font-black tracking-tight mb-2 uppercase italic break-words">
          {dungeon.name}
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-1 text-yellow-400 shrink-0">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                fill={i < (dungeon.difficulty || 5) ? "currentColor" : "none"}
                className={i >= (dungeon.difficulty || 5) ? "text-slate-600" : ""}
              />
            ))}
          </div>

          <div className="flex justify-end w-full sm:w-auto">
            <button
              onClick={handlePlay}
              className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-bold text-sm px-5 py-2 rounded-xl flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.3)] shrink-0"
            >
              ダンジョンで遊ぶ
              <Play size={12} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>

      {/* スタッツグリッド */}
      <div className="flex flex-wrap gap-3">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-slate-800/60 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2"
          >
            <stat.icon size={14} className="text-slate-400" />
            <span className="text-[10px] text-slate-500 font-bold uppercase">{stat.label}</span>
            <span className="text-sm font-mono font-bold text-slate-200">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* タグ & 説明文 */}
      <div className="space-y-2">
        {/* タグ */}
        <div className="flex flex-wrap gap-2">
          {dungeon.tags?.map((tag: string) => (
            <span key={tag} className="bg-white text-slate-900 text-[10px] font-black px-2 py-0.5 rounded italic">
              {tag.toUpperCase()}
            </span>
          ))}
        </div>

        {/* 説明文 */}
        <p className="text-slate-300 leading-relaxed text-sm bg-slate-900/30 p-4 rounded-xl border border-slate-800">
          {dungeon.description || "このダンジョンに説明はありません。"}
        </p>
      </div>
    </div>
  );
}
