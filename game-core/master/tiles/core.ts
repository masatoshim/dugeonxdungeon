import { TileConfig, TILE_CATEGORIES } from "@/game-core/types/tiles";

export const CORE_TILES = {
  P: { name: "プレイヤー", category: TILE_CATEGORIES.PLAYER, texture: "player" },
  G: { name: "ゴール", category: TILE_CATEGORIES.GOAL, texture: "goal" },
  W: { name: "壁", category: TILE_CATEGORIES.WALL, texture: "wall" },
  BW1: {
    name: "--未使用 壊れる壁1",
    category: TILE_CATEGORIES.WALL,
    texture: "wallbreakable1",
    isBreakable: true,
    hp: 1,
  },
  BW2: {
    name: "壊れる壁1",
    category: TILE_CATEGORIES.WALL,
    texture: "wallbreakable2",
    isBreakable: true,
    hp: 1,
  },
  BW3: {
    name: "壊れる壁2",
    category: TILE_CATEGORIES.WALL,
    texture: "wallbreakable3",
    isBreakable: true,
    hp: 3,
  },
  " ": { name: "床", category: TILE_CATEGORIES.EMPTY, texture: "empty" },
} as const satisfies Record<string, TileConfig>;
