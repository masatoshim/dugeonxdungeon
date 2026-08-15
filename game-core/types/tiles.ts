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
  xsize: number;
  ysize: number;
  xoffset: number;
  yoffset: number;
  moveSteps: number;
  speed: number;
  moveType:
    | "RANDOM" // ランダム移動
    | "HORIZONTAL" // 横移動のみ
    | "VERTICAL" // 縦移動のみ
    | "CHASE" // プレイヤーの位置を常に把握して追跡
    | "CHASE_2" // プレイヤーを感知してから追跡
    | "CHASE_3" // プレイヤーを感知したら直進して追跡
    | "CHASE_4" // プレイヤーの視界に入っている場合停止
    | "RANGED" // プレイヤーを感知して遠隔攻撃
    | "MIRROR"; // プレイヤーの動きを模倣
  // moveTypeがCHASE_2専用のパラメータ。プレイヤーを感知できる距離
  chaseDistance?: number;
  // moveTypeがCHASE_2専用のパラメータ。プレイヤーを感知後の加速度を設定
  speedUp?: number;
  // moveTypeがCHASE_3専用のパラメータ。壁衝突後の索敵待機時間 ms
  chaseCooldown?: number;
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
  // moveTypeがMIRROR専用のパラメータ
  mirrorAxis?: "BOTH" | "HORIZONTAL_ONLY" | "VERTICAL_ONLY";
  animType: "SINGLE" | "DIRECTIONAL" | "DIRECTIONAL_2" | "DIRECTIONAL_3"; // SINGLE: 進行方向に依存しない。　DIRECTIONAL: 進行方向ごとにアニメーション切り替え
  animSize: number;
  frameRate?: number;
  isInvincible?: boolean; // 無敵判定
  isGhost?: boolean; // 障害物すり抜け判定
  isStealth?: boolean; //ステルス判定
  detectDistance?: number; // 姿が見え始める距離。isStealthがtrueの時のみ適用
  isObstacle?: boolean; // 障害物判定。触れてもダメージを負わない
  stunDuration?: number; // 攻撃を受けてから復帰するまでの待機時間 ms
  // 足跡のパラメータ
  footstompData?: {
    footstompTexture: AssetKey; // 足跡のテクスチャのキー
    hasDirection?: boolean; // 足跡の方向性判定
    duration?: number; // 足跡の寿命 ms
    validItemId?: string; // 足跡解除用のアイテムのID
  };
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
  element?: "STONE" | "ICE" | "BLOCK";
}

export type AllowedDirection = "RIGHT" | "LEFT" | "UP" | "DOWN" | "HORIZONTAL" | "VERTICAL" | "ALL";

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
      | "WARP_TWO_WAY2"
      | "LEVER_SWITCH"
      | "LEVER_SWITCH_DOOR";
    linkGroup: "KEY_DOOR" | "BUTTON_DOOR" | "WARP" | "WARP_TWO_WAY" | "LEVER_SWITCH_DOOR";
    targetEntityType:
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
  };
  allowedDirection?: AllowedDirection;
  color?: "RED" | "BLUE" | "YELLOW" | "GREEN";
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
