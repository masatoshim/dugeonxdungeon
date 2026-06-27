import { TileConfig, TILE_CATEGORIES } from "../../types/tiles";

export const ENEMY_TILES: Record<string, TileConfig> = {
  E1: {
    name: "スライム",
    category: TILE_CATEGORIES.ENEMY,
    texture: "enemies",
    frame: 0,
    enemyData: { id: "E_SLIME", name: "スライム", hp: 1, moveType: "RANDOM", speed: 60 },
  },
};
