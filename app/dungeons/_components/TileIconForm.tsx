"use client";

import { TILE_CONFIG, ASSETS } from "@/types";

// タイルの表示用コンポーネント（Phaserのスプライトシートを模倣）
export const TileIconForm = ({ tileId, size = 32 }: { tileId: string; size?: number }) => {
  const config = TILE_CONFIG[tileId as keyof typeof TILE_CONFIG];
  if (!config || tileId === "..") return <div style={{ width: size, height: size }} className="bg-gray-900" />;

  // キーを明示的にキャスト
  const textureKey = config.texture as keyof typeof ASSETS;
  const texturePath = ASSETS[textureKey];

  // スプライトシートが横に並んでいる想定 (32px間隔)
  const frameX = (config.frame || 0) * size;

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${texturePath})`,
        backgroundPosition: `-${frameX}px 0px`,
        backgroundSize: `auto ${size}px`,
        imageRendering: "pixelated",
        backgroundRepeat: "no-repeat", // 意図しない繰り返しを防ぐ
      }}
    />
  );
};
