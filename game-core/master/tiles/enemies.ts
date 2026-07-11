import { TileConfig, TILE_CATEGORIES } from "@/game-core/types/tiles";

export const ENEMY_TILES = {
  E1: {
    name: "スライム",
    category: TILE_CATEGORIES.ENEMY,
    texture: "slime",
    enemyData: {
      id: "E_SLIME",
      name: "スライム",
      hp: 1,
      xsize: 26,
      ysize: 22,
      xoffset: 3,
      yoffset: 8,
      speed: 60,
      moveType: "RANDOM",
      animType: "SINGLE",
      animSize: 8,
    },
  },
} as const satisfies Record<string, TileConfig>;
