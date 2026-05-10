import { TILE_CONFIG, ASSETS } from "@/types";

// タイルの表示用コンポーネント
export const TileIconForm = ({ tileId, size = 32 }: { tileId: string; size?: number }) => {
  const config = TILE_CONFIG[tileId as keyof typeof TILE_CONFIG];

  // 該当なし、または空タイルの場合は背景色のみ表示
  if (!config || tileId === "..") {
    return <div className="bg-slate-900 rounded-sm" style={{ width: size, height: size }} />;
  }

  const textureKey = config.texture as keyof typeof ASSETS;
  const texturePath = ASSETS[textureKey];
  const frameX = (config.frame || 0) * size;

  return (
    <div
      className="bg-no-repeat rendering-pixelated"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${texturePath})`,
        backgroundPosition: `-${frameX}px 0px`,
        backgroundSize: `auto ${size}px`,
      }}
    />
  );
};
