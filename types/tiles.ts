import { EnemyData, StoneData } from "./game";
import { WeaponData, Item } from "./item";

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
