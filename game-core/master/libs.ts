import { TILE_CONFIG } from ".";
import { MapData } from "../types";

export function getRequiredAssetKeys(mapData: MapData): string[] {
  const requiredAssetKeys = new Set<string>();

  // 常にロードすべきアセットを全追加
  Object.values(TILE_CONFIG).forEach((config) => {
    if (config.alwaysLoad && config.texture) {
      requiredAssetKeys.add(config.texture);
    }
  });

  // mapData.tilesから使用されているタイルを走査
  if (mapData?.tiles) {
    mapData.tiles.forEach((row) => {
      row.forEach((tileId) => {
        const config = TILE_CONFIG[tileId];
        if (config) {
          if (config.texture) requiredAssetKeys.add(config.texture);
          if (config.setLoadTexture && config.setLoadTexture.length > 0)
            config.setLoadTexture.forEach((texture) => requiredAssetKeys.add(texture));
        }
      });
    });
  }

  // mapData.entitiesから使用されているエンティティを走査
  if (mapData?.entities) {
    mapData.entities.forEach((entity) => {
      const config = TILE_CONFIG[entity.tileId];
      if (config) {
        if (config.texture) requiredAssetKeys.add(config.texture);
        if (config.setLoadTexture && config.setLoadTexture.length > 0)
          config.setLoadTexture.forEach((texture) => requiredAssetKeys.add(texture));
      }
    });
  }

  return Array.from(requiredAssetKeys);
}
