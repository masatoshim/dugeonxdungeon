import { Item, WeaponData } from "./items";
import { TILE_CONFIG } from "../master";

export const TILE_CATEGORIES = {
  EMPTY: "EMPTY",
  WALL: "WALL",
  STONE: "STONE",
  ICE: "ICE",
  PLAYER: "PLAYER",
  ENEMY: "ENEMY",
  ITEM: "ITEM",
  GIMMICK: "GIMMICK",
  GOAL: "GOAL",
} as const;

export type TileCategory = (typeof TILE_CATEGORIES)[keyof typeof TILE_CATEGORIES];

export interface EnemyData {
  id: string;
  name: string;
  hp?: number;
  moveType?: "RANDOM" | "HORIZONTAL";
  speed?: number;
}

export interface TileConfig {
  name: string;
  category: TileCategory;
  texture: string;
  frame: number;
  openFrame?: number;
  isBreakable?: boolean;
  isLocked?: boolean;
  hp?: number;
  enemyData?: EnemyData;
  item?: Item;
  weaponData?: WeaponData;
}

export type TileConfigKey = keyof typeof TILE_CONFIG;

// エディタパレット用型定義
export interface PaletteItem {
  id: string;
  isEraser?: boolean;
}

export interface PaletteSubGroup {
  subLabel?: string;
  items: PaletteItem[];
}

export interface PaletteGroup {
  label: string;
  subGroups: PaletteSubGroup[];
}
