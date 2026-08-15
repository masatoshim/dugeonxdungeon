import { ASSETS, TILE_CONFIG } from "@/game-core/master";
import { TILE_SIZE } from "@/game-core/types";
import { TileConfigKey } from "@/game-core/master";

// タイルの表示用コンポーネント
export const TileIconForm = ({ tileId, size = TILE_SIZE }: { tileId: TileConfigKey; size?: number }) => {
  const config = TILE_CONFIG[tileId];

  // 該当なし、または空タイルの場合は背景色のみ表示
  if (!config || tileId === " ") {
    return <div className="bg-slate-900 rounded-sm" style={{ width: size, height: size }} />;
  }

  const textureKey = config.texture;
  const texturePath = ASSETS[textureKey];
  const scale = size / TILE_SIZE;

  return (
    <div className="overflow-hidden bg-slate-900/50 rounded-sm" style={{ width: size, height: size }}>
      <div
        className="bg-no-repeat rendering-pixelated"
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundImage: `url(${texturePath})`,
          backgroundPosition: `-0px 0px`,
          backgroundSize: `auto ${TILE_SIZE}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
};
