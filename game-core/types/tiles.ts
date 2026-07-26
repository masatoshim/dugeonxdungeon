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
  score: number;
  xsize?: number;
  ysize?: number;
  xoffset?: number;
  yoffset?: number;
  moveSteps?: number;
  speed?: number;
  moveType?: "RANDOM" | "HORIZONTAL" | "VERTICAL" | "CHASE";
  animType?: "SINGLE" | "DIRECTIONAL"; // SINGLE: 進行方向に依存しない。　DIRECTIONAL: 進行方向ごとにアニメーション切り替え
  animSize?: number;
  frameRate?: number;
  isInvincible?: boolean;
}

export interface StoneData {
  id: string;
  stoneType?: "NORMAL" | "BREAKABLE" | "HEAVY" | "SPIKE";
  element?: "STONE" | "ICE";
}

export interface TileConfig {
  name: string;
  category: TileCategory;
  texture: AssetKey;
  linkConfig?: {
    entityType: "KEY" | "KEY_DOOR" | "BUTTON" | "BUTTON_DOOR" | "WARP_IN" | "WARP_OUT";
    linkGroup: "KEY_DOOR" | "BUTTON_DOOR" | "WARP";
    targetEntityType: "KEY" | "KEY_DOOR" | "BUTTON" | "BUTTON_DOOR" | "WARP_IN" | "WARP_OUT";
  };
  openFrame?: number;
  isBreakable?: boolean;
  isLocked?: boolean;
  hp?: number;
  stoneData?: StoneData;
  enemyData?: EnemyData;
  item?: Item;
  weaponData?: WeaponData;
  description?: string;
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
