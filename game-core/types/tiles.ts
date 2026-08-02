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
  moveType?: "RANDOM" | "HORIZONTAL" | "VERTICAL" | "CHASE" | "CHASE_2" | "RANGED";
  // moveTypeがCHASE_2専用のパラメータ。プレイヤーを感知できる距離
  chaseDistance?: number;
  // moveTypeがCHASE_2専用のパラメータ。プレイヤーを感知後の加速度を設定
  speedUp?: number;
  // moveTypeがRANGED専用のパラメータ
  rangedData?: {
    bulletTexture?: AssetKey; // 使用する弾のアセットキー
    bulletAnim?: BulletAnimConfig;
    bulletSpeed?: number; // 弾速
    prepareTime?: number; // 溜め時間 ms
    cooldown?: number; // 攻撃後の再攻撃待ち時間 ms
    shotCount?: number; // 1回の攻撃で撃つ弾数
    shotInterval?: number; // 連射等の場合の弾間隔 ms
  };
  animType?: "SINGLE" | "DIRECTIONAL" | "DIRECTIONAL_2"; // SINGLE: 進行方向に依存しない。　DIRECTIONAL: 進行方向ごとにアニメーション切り替え
  animSize?: number;
  frameRate?: number;
  isInvincible?: boolean; // 無敵判定
  isGhost?: boolean; // 障害物すり抜け判定
  isStealth?: boolean; //ステルス判定
  detectDistance?: number; // 姿が見え始める距離。isStealthがtrueの時のみ適用
}

// EnemyDataの遠隔攻撃用クラス
export interface BulletAnimConfig {
  key?: AssetKey;
  animSize?: number;
  frameRate?: number;
  bodyRadius?: number; // 円形当たり判定の半径
  bodySize?: { width: number; height: number }; // 矩形当たり判定のサイズ
  offsetX?: number;
  offsetY?: number;
}

export interface StoneData {
  id: string;
  stoneType?: "NORMAL" | "BREAKABLE" | "HEAVY" | "SPIKE";
  element?: "STONE" | "ICE";
  allowedDirection?: "RIGHT" | "LEFT" | "UP" | "DOWN" | "HORIZONTAL" | "VERTICAL" | "ALL";
}

export interface TileConfig {
  name: string;
  category: TileCategory;
  texture: AssetKey;
  linkConfig?: {
    entityType:
      | "KEY"
      | "KEY_DOOR"
      | "BUTTON"
      | "BUTTON_DOOR"
      | "WARP_IN"
      | "WARP_OUT"
      | "WARP_TWO_WAY1"
      | "WARP_TWO_WAY2";
    linkGroup: "KEY_DOOR" | "BUTTON_DOOR" | "WARP" | "WARP_TWO_WAY";
    targetEntityType:
      | "KEY"
      | "KEY_DOOR"
      | "BUTTON"
      | "BUTTON_DOOR"
      | "WARP_IN"
      | "WARP_OUT"
      | "WARP_TWO_WAY1"
      | "WARP_TWO_WAY2";
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
