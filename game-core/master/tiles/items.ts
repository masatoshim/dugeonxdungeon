import { TileConfig, TILE_CATEGORIES } from "@/game-core/types/tiles";

export const ITEM_TILES = {
  S1: {
    name: "剣",
    category: TILE_CATEGORIES.ITEM,
    texture: "weaponSword",
    weaponData: { id: "SWORD", name: "剣", range: 28, size: 10, damage: 1, cooldown: 300 },
  },
  J1: {
    name: "赤い宝石",
    category: TILE_CATEGORIES.ITEM,
    texture: "jewel1",
    item: { id: "JEWEL1", name: "赤い宝石", type: "SCORE_ITEM", score: 1000 },
  },
} as const satisfies Record<string, TileConfig>;
