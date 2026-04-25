import dynamic from "next/dynamic";
import { MapData } from "@/types";

// Canvas操作を含むコンポーネントをロード
const GameCanvas = dynamic(() => import("@/app/dungeons/_components/game/GameCanvas"), {
  ssr: false,
});
const GameUI = dynamic(() => import("@/app/dungeons/_components/game/GameUI"), {
  ssr: false,
});

interface PlayGameContentProps {
  dungeon: {
    name: string;
    difficulty: string | number;
    timeLimit: number;
    description?: string | null;
  };
  parsedMapData: MapData;
  isFinished: boolean;
  onClear: (score: number, timeLeft: number) => void;
  onGameOver: (score: number, timeLeft: number) => void;
}

export function PlayGameContent({ dungeon, parsedMapData, isFinished, onClear, onGameOver }: PlayGameContentProps) {
  return (
    <main className="flex flex-col items-center p-8 bg-gray-900 min-h-screen text-white">
      {/* ダンジョン名 */}
      <h1 className="text-3xl font-bold mb-4">{dungeon.name}</h1>

      {/* ゲームエリア */}
      <div className="relative border-4 border-gray-700 rounded-lg overflow-hidden shadow-2xl bg-black">
        {/* mapData と timeLimit を渡す */}
        <GameCanvas mapData={parsedMapData} timeLimit={dungeon.timeLimit} onClear={onClear} onGameOver={onGameOver} />

        {/* UIオーバーレイ */}
        <GameUI isFinished={isFinished} initialTime={dungeon.timeLimit} />
      </div>

      {/* ダンジョン情報セクション */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg w-full max-w-2xl border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xl font-semibold text-yellow-500">難易度: {dungeon.difficulty}</span>
          <span className="text-xl font-semibold text-blue-400">制限時間: {dungeon.timeLimit}s</span>
        </div>

        <p className="text-gray-300 italic mb-4">{dungeon.description || "このダンジョンに説明はありません。"}</p>

        <div className="text-sm text-gray-400 bg-gray-900 p-3 rounded-md border border-gray-700 flex items-center gap-2">
          <span className="text-lg">🎮</span>
          <span>操作方法: 矢印キーで移動 / スペースキーでアクション</span>
        </div>
      </div>
    </main>
  );
}
