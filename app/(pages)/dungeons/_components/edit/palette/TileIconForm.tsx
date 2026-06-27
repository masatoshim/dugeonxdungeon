import { ASSETS, TILE_CONFIG } from "@/game-core/master";
import { TileConfigKey } from "@/game-core/master";

// タイルの表示用コンポーネント
export const TileIconForm = ({ tileId, size = 32 }: { tileId: TileConfigKey; size?: number }) => {
  const config = TILE_CONFIG[tileId];

  // 該当なし、または空タイルの場合は背景色のみ表示
  if (!config || tileId === " ") {
    return <div className="bg-slate-900 rounded-sm" style={{ width: size, height: size }} />;
  }

  const textureKey = config.texture;
  const texturePath = ASSETS[textureKey];
  const BASE_SIZE = 32;

  const scale = size / BASE_SIZE;

  return (
    <div className="overflow-hidden bg-slate-900/50 rounded-sm" style={{ width: size, height: size }}>
      <div
        className="bg-no-repeat rendering-pixelated"
        style={{
          width: BASE_SIZE,
          height: BASE_SIZE,
          backgroundImage: `url(${texturePath})`,
          backgroundPosition: `-0px 0px`,
          backgroundSize: "auto 32px",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
};
