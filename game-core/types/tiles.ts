import { Item, WeaponData } from "@/game-core/types";
import { TileConfigKey, AssetKey } from "@/game-core/master";

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
  xsize?: number;
  ysize?: number;
  xoffset?: number;
  yoffset?: number;
  speed?: number;
  moveType?: "RANDOM" | "HORIZONTAL";
  animType?: "SINGLE" | "DIRECTIONAL"; // SINGLE: 進行方向に依存しない。　DIRECTIONAL: 進行方向ごとにアニメーション切り替え
  animSize?: number;
}

export interface TileConfig {
  name: string;
  category: TileCategory;
  texture: AssetKey;
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
