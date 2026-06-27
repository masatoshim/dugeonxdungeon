import { CORE_TILES } from "./tiles/core";
import { GIMMICK_TILES } from "./tiles/gimmicks";
import { ENEMY_TILES } from "./tiles/enemies";
import { ITEM_TILES } from "./tiles/items";
import { TileConfig } from "../types/tiles";

export * from "./assets";
export * from "./palette";

// すべてのドメインのタイルマスタを統合
export const TILE_CONFIG: Record<string, TileConfig> = {
  ...CORE_TILES,
  ...GIMMICK_TILES,
  ...ENEMY_TILES,
  ...ITEM_TILES,
};
