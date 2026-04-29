import { prisma } from "@/app/_libs/prisma";
import { PlayerInventory } from "./item";
import type Phaser from "phaser";

export type Dungeon = NonNullable<Awaited<ReturnType<typeof prisma.dungeon.findUnique>>>;

// イベント通知
export const GAME_EVENTS = {
  GAME_CLEAR: "game-clear",
  GAME_OVER: "game-over",
  TIME_OVER: "time-over",
};

// ダンジョン設定のデフォルト値・制限値
export const DUNGEON_DEFAULT = {
  ROWS: 10,
  COLS: 10,
  TIME_LIMIT: 60,
  MIN_SIZE: 4,
  MAX_SIZE: 256,
} as const;

export interface EntityData {
  id: string; // 一意のID（ボタンと扉の紐付け用など）
  type: "ROCK" | "IRON_BALL" | "ICE" | "BUTTON" | "DOOR" | "KEY" | "SWITCH" | "LIGHT";
  x: number;
  y: number;
  properties?: {
    // 各ギミック固有の設定
    targetId?: string; // ボタンが操作する扉のID
    tileId?: string;
    useCount?: number; // 使用回数制限
    isLocked?: boolean; // 最初から鍵がかかっているか
  };
}

export interface MapData {
  tiles: string[][];
  entities: EntityData[]; // 動的なオブジェクトはここに集約
  settings: {
    isDark: boolean; // 初期状態が真っ暗かどうか
    ambientLight: number; // 明るさの度合い
  };
}

// ゲームの実行時状態
export interface GameState {
  inventory: PlayerInventory;
  isDark: boolean;
  score: number;
  status: "PLAYING" | "GAMEOVER" | "CLEAR";
}

export interface EnemyData {
  id: string;
  name: string;
  hp?: number;
  moveType?: "RANDOM" | "HORIZONTAL"; // Todo: Typeはこれから増える見込み
  speed?: number;
}

export interface GimmickConnection {
  button: Phaser.Physics.Arcade.Sprite;
  door: Phaser.Physics.Arcade.Sprite;
}

export interface StoneData {
  drag: number; // 空気抵抗・摩擦（ブレーキ）
}
