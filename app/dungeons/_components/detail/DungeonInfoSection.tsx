import { Maximize, Clock, Footprints, LogOut, Timer, Star } from "lucide-react";
import { DungeonResponse, DungeonsIndexResponse } from "@/types";

interface DungeonInfoProps {
  dungeon: DungeonResponse;
  isCleared: boolean;
}

export function DungeonInfoSection({ dungeon, isCleared }: DungeonInfoProps) {
  // スタッツ項目を配列化してループで表示
  const stats = [
    { icon: Maximize, label: "ダンジョンサイズ", value: `${dungeon.mapSizeHeight} x ${dungeon.mapSizeWidth}` },
    { icon: Clock, label: "制限時間", value: `${dungeon.timeLimit}sec` },
    { icon: Footprints, label: "挑戦者の足跡", value: `${dungeon.totalPlayCount}回` },
    { icon: LogOut, label: "帰還者の足跡", value: `${dungeon.clearPlayCount}人` },
    { icon: Timer, label: "平均踏破時間", value: `${dungeon.averageClearTime ?? "--"}sec` },
  ];

  return (
    <div className="text-white space-y-6">
      {/* ユーザー情報 & お気に入り・攻略状況 */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold border border-indigo-400">
            {dungeon.nickName?.[0] || "U"}
          </div>
          <span className="font-bold text-slate-200">{dungeon.nickName}</span>
        </div>
        <div className="flex gap-2">
          <div className="bg-pink-500/20 text-pink-400 border border-pink-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <span>❤️ お気に入り</span>
            <span className="bg-white/20 px-2 rounded ml-1">{dungeon.favouritesCount || 0}</span>
          </div>
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

      {/* タイトル & 難易度 */}
      <div>
        <div className="text-slate-500 font-mono text-sm mb-1">{dungeon.code}</div>
        <h2 className="text-4xl font-black tracking-tight mb-2 uppercase italic">{dungeon.name}</h2>
        <div className="flex gap-1 text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={20}
              fill={i < (dungeon.difficulty || 5) ? "currentColor" : "none"}
              className={i >= (dungeon.difficulty || 5) ? "text-slate-600" : ""}
            />
          ))}
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

      {/* プレイボタン */}
      <div className="flex justify-end pt-4">
        <button className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-black px-8 py-3 rounded-xl flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
          ダンジョンで遊ぶ
          <Maximize size={18} />
        </button>
      </div>
    </div>
  );
}
