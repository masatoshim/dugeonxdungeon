import { Item, WeaponData } from "@/game-core/types";
import { TileConfigKey } from "@/game-core/master";

export const TILE_CATEGORIES = {
  EMPTY: "EMPTY",
  WALL: "WALL",
  STONE: "STONE",
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
  openFrame?: number;
  isBreakable?: boolean;
  isLocked?: boolean;
  hp?: number;
  enemyData?: EnemyData;
  item?: Item;
  weaponData?: WeaponData;
}

// エディタパレット用型定義
export interface PaletteItem {
  id: TileConfigKey;
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
