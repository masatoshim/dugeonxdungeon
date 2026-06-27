import { TileConfig, TILE_CATEGORIES } from "@/game-core/types/tiles";

export const CORE_TILES: Record<string, TileConfig> = {
  P: { name: "プレイヤー", category: TILE_CATEGORIES.PLAYER, texture: "player_idle", frame: 0 },
  G: { name: "ゴール", category: TILE_CATEGORIES.GOAL, texture: "goal", frame: 0 },
  W: { name: "壁", category: TILE_CATEGORIES.WALL, texture: "wall", frame: 0 },
  BW1: {
    name: "壊れる壁1",
    category: TILE_CATEGORIES.WALL,
    texture: "wallbreakable1",
    frame: 0,
    isBreakable: true,
    hp: 1,
  },
  BW3: {
    name: "壊れる壁3",
    category: TILE_CATEGORIES.WALL,
    texture: "wallbreakable3",
    frame: 0,
    isBreakable: true,
    hp: 3,
  },
};
