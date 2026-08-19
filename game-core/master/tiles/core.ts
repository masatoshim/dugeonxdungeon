import { TileConfig, TILE_CATEGORIES } from "@/game-core/types/tiles";

export const CORE_TILES = {
  P: { name: "プレイヤー", category: TILE_CATEGORIES.PLAYER, texture: "player" },
  G: { name: "ゴール", category: TILE_CATEGORIES.GOAL, texture: "goal" },
  W: { name: "壁", category: TILE_CATEGORIES.WALL, texture: "wall" },
  WB1: {
    name: "--未使用 壊れる壁1",
    category: TILE_CATEGORIES.WALL,
    texture: "wallbreakable1",
    isBreakable: true,
    hp: 1,
  },
  WB2: {
    name: "壊れる壁",
    category: TILE_CATEGORIES.WALL,
    texture: "wallbreakable2",
    isBreakable: true,
    hp: 1,
  },
  WB3: {
    name: "壊れる壁2",
    category: TILE_CATEGORIES.WALL,
    texture: "wallbreakable3",
    isBreakable: true,
    hp: 3,
  },
  CWR: {
    name: "赤壁",
    category: TILE_CATEGORIES.WALL,
    texture: "colorWallRed",
    color: "RED",
    isBreakable: false,
  },
  CWB: {
    name: "青壁",
    category: TILE_CATEGORIES.WALL,
    texture: "colorWallBlue",
    color: "BLUE",
    isBreakable: false,
  },
  CWY: {
    name: "黄壁",
    category: TILE_CATEGORIES.WALL,
    texture: "colorWallYellow",
    color: "YELLOW",
    isBreakable: false,
  },
  CWG: {
    name: "緑壁",
    category: TILE_CATEGORIES.WALL,
    texture: "colorWallGreen",
    color: "GREEN",
    isBreakable: false,
  },
  " ": { name: "床", category: TILE_CATEGORIES.EMPTY, texture: "empty" },
} as const satisfies Record<string, TileConfig>;
