import { PlayerInventory } from "@/game-core/types";
import { TileConfigKey } from "@/game-core/master";
import type Phaser from "phaser";

export const GAME_EVENTS = {
  GAME_CLEAR: "game-clear",
  GAME_OVER: "game-over",
  TIME_OVER: "time-over",
} as const;

export const TILE_SIZE = 32;

export const DUNGEON_DEFAULT = {
  ROWS: 10,
  COLS: 10,
  TIME_LIMIT: 60,
  MIN_SIZE: 4,
  MAX_SIZE: 99,
} as const;

export interface EntityData {
  id: string;
  tileId: TileConfigKey;
  x: number;
  y: number;
  properties?: {
    targetId?: string;
    useCount?: number;
    isLocked?: boolean;
  };
}

export interface MapData {
  tiles: TileConfigKey[][];
  entities?: EntityData[];
  settings?: {
    isDark: boolean;
    ambientLight: number;
  };
  width: number;
  height: number;
}

export interface GameState {
  inventory: PlayerInventory;
  isDark: boolean;
  score: number;
  status: "PLAYING" | "GAMEOVER" | "CLEAR";
}

export interface LevelGroups {
  walls: Phaser.Physics.Arcade.StaticGroup;
  doors: Phaser.Physics.Arcade.StaticGroup;
  breakableWalls: Phaser.Physics.Arcade.StaticGroup;
  items: Phaser.Physics.Arcade.StaticGroup;
  enemies: Phaser.Physics.Arcade.Group;
  goal: Phaser.Physics.Arcade.StaticGroup;
  movableStones: Phaser.Physics.Arcade.Group;
  warps: Phaser.Physics.Arcade.StaticGroup;
  buttonsGroup: Phaser.Physics.Arcade.StaticGroup;
  leversGroup: Phaser.Physics.Arcade.StaticGroup;
  onPlayerCreate: (x: number, y: number) => void;
}
