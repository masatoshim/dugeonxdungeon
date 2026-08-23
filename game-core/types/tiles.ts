import { Item, WeaponData, EnemyData } from "@/game-core/types";
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

export interface StoneData {
  id: string;
  stoneType?: "NORMAL" | "BREAKABLE" | "HEAVY" | "SPIKE";
  element?: "STONE" | "ICE" | "BLOCK";
}

export type AllowedDirectionType = "RIGHT" | "LEFT" | "UP" | "DOWN" | "HORIZONTAL" | "VERTICAL" | "ALL";

export type ColorType = "RED" | "BLUE" | "YELLOW" | "GREEN";

export type LinkEntityType =
  | "KEY"
  | "KEY_DOOR"
  | "BUTTON"
  | "BUTTON_DOOR"
  | "WARP_IN"
  | "WARP_OUT"
  | "WARP_TWO_WAY1"
  | "WARP_TWO_WAY2"
  | "LEVER_SWITCH"
  | "LEVER_SWITCH_DOOR";

export type LinkGroupType = "KEY_DOOR" | "BUTTON_DOOR" | "WARP" | "WARP_TWO_WAY" | "LEVER_SWITCH_DOOR";

export interface TileConfig {
  name: string;
  category: TileCategory;
  texture: AssetKey;
  linkConfig?: {
    entityType: LinkEntityType;
    linkGroup: LinkGroupType;
    targetEntityType: LinkEntityType;
  };
  allowedDirection?: AllowedDirectionType;
  color?: ColorType;
  openFrame?: number;
  maxCount?: number;
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
