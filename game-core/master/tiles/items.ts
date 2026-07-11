import { TileConfig, TILE_CATEGORIES } from "@/game-core/types/tiles";

export const ITEM_TILES = {
  S1: {
    name: "剣",
    category: TILE_CATEGORIES.ITEM,
    texture: "weaponSword",
    weaponData: { id: "SWORD", name: "剣", range: 28, size: 10, damage: 2, cooldown: 300 },
  },
} as const satisfies Record<string, TileConfig>;
