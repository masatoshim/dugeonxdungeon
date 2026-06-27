import { TileConfig, TILE_CATEGORIES } from "@/game-core/types/tiles";

export const ITEM_TILES: Record<string, TileConfig> = {
  S1: {
    name: "剣",
    category: TILE_CATEGORIES.ITEM,
    texture: "weaponSword",
    frame: 0,
    weaponData: { id: "SWORD", name: "剣", range: 28, size: 24, damage: 2, cooldown: 300 },
  },
};
