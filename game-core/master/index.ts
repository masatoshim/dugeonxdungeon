import { CORE_TILES } from "@/game-core/master/tiles/core";
import { GIMMICK_TILES } from "@/game-core/master/tiles/gimmicks";
import { ENEMY_TILES } from "@/game-core/master/tiles/enemies";
import { ITEM_TILES } from "@/game-core/master/tiles/items";
import { TileConfig } from "@/game-core/types/tiles";

export * from "@/game-core/master/assets";
export * from "@/game-core/master/palette";

const rawConfig = {
  ...CORE_TILES,
  ...GIMMICK_TILES,
  ...ENEMY_TILES,
  ...ITEM_TILES,
} as const;

export type TileConfigKey = keyof typeof rawConfig;

export const TILE_CONFIG: { readonly [K in TileConfigKey]: TileConfig } = rawConfig;
