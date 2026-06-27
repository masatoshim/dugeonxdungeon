import { PlayerInventory } from "@/game-core/types";
import { TileConfigKey } from "@/game-core/master";
import { TileCategory } from "@/game-core/types";
import type Phaser from "phaser";

export const GAME_EVENTS = {
  GAME_CLEAR: "game-clear",
  GAME_OVER: "game-over",
  TIME_OVER: "time-over",
} as const;

export const DUNGEON_DEFAULT = {
  ROWS: 10,
  COLS: 10,
  TIME_LIMIT: 60,
  MIN_SIZE: 4,
  MAX_SIZE: 256,
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

export interface GimmickConnection {
  button: Phaser.Physics.Arcade.Sprite;
  door: Phaser.Physics.Arcade.Sprite;
}

export interface LevelGroups {
  walls: Phaser.Physics.Arcade.StaticGroup;
  doors: Phaser.Physics.Arcade.StaticGroup;
  breakableWalls: Phaser.Physics.Arcade.StaticGroup;
  items: Phaser.Physics.Arcade.StaticGroup;
  enemies: Phaser.Physics.Arcade.Group;
  goal: Phaser.Physics.Arcade.StaticGroup;
  movableStones: Phaser.Physics.Arcade.Group;
  onPlayerCreate: (x: number, y: number) => void;
}
