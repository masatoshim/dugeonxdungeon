import { EnemyData } from "./game";
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

export const TILE_CONFIG: Record<string, TileConfig> = {
  P: { name: "プレイヤー", category: TILE_CATEGORIES.PLAYER, texture: "player_idle", frame: 0 },
  G: { name: "ゴール", category: TILE_CATEGORIES.GOAL, texture: "tileset", frame: 0 },

  W: { name: "壁", category: TILE_CATEGORIES.WALL, texture: "tileset", frame: 2 },
  BW1: {
    name: "壊れる壁1",
    category: TILE_CATEGORIES.WALL,
    texture: "tileset",
    frame: 1,
    isBreakable: true,
    hp: 1,
  },
  BW3: {
    name: "壊れる壁3",
    category: TILE_CATEGORIES.WALL,
    texture: "tileset",
    frame: 3,
    isBreakable: true,
    hp: 3,
  },

  R1: {
    name: "石",
    category: TILE_CATEGORIES.STONE,
    texture: "stones",
    frame: 0,
  },
  R3: {
    name: "氷",
    category: TILE_CATEGORIES.ICE,
    texture: "stones",
    frame: 2,
  },

  B1: {
    name: "ボタン",
    category: TILE_CATEGORIES.GIMMICK,
    texture: "buttons",
    frame: 0,
    openFrame: 1, // 押された時
  },
  D1: {
    name: "ボタン扉",
    category: TILE_CATEGORIES.GIMMICK,
    texture: "doors",
    frame: 1,
    openFrame: 0,
  },
  K1: {
    name: "鍵",
    category: TILE_CATEGORIES.GIMMICK,
    texture: "items",
    frame: 1,
    item: {
      id: "KEY_SILVER",
      name: "銀の鍵",
      type: "KEY",
      consumesOnUse: true,
    },
  },
  KD1: {
    name: "鍵扉",
    category: TILE_CATEGORIES.GIMMICK,
    texture: "doors",
    frame: 3,
    openFrame: 2,
    isLocked: true,
  },

  // 武器
  S1: {
    name: "剣",
    category: TILE_CATEGORIES.ITEM,
    texture: "items",
    frame: 0,
    weaponData: {
      id: "SWORD",
      name: "剣",
      range: 28,
      size: 24,
      damage: 2,
      cooldown: 300,
    },
  },

  // 敵
  E1: {
    name: "スライム",
    category: TILE_CATEGORIES.ENEMY,
    texture: "enemies",
    frame: 0,
    enemyData: {
      id: "E_SLIME",
      name: "スライム",
      hp: 1,
      moveType: "RANDOM",
      speed: 60,
    },
  },
};

export type TileConfigKey = keyof typeof TILE_CONFIG;

export interface PaletteItem {
  id: string; // "P", "G", ".." (消しゴム) など
  isEraser?: boolean;
}

export interface PaletteSubGroup {
  subLabel?: string; // グループ内の小見出し（「ボタン/扉」「鍵/扉」など。）
  items: PaletteItem[];
}

export interface PaletteGroup {
  label: string; // グループ名
  subGroups: PaletteSubGroup[];
}

// 編集画面のパレット制御用
export const TILE_PALETTE_SCHEMA: PaletteGroup[] = [
  {
    label: "プレイヤーとゴール",
    subGroups: [
      {
        items: [{ id: "P" }, { id: "G" }],
      },
    ],
  },
  {
    label: "壁",
    subGroups: [
      {
        items: [{ id: "W" }, { id: "BW1" }, { id: "BW3" }],
      },
    ],
  },
  {
    label: "ギミック",
    subGroups: [
      {
        subLabel: "動かせる石",
        items: [{ id: "R1" }, { id: "R3" }],
      },
      {
        subLabel: "ボタンと扉",
        items: [{ id: "B1" }, { id: "D1" }],
      },
      {
        subLabel: "カギと扉",
        items: [{ id: "K1" }, { id: "KD1" }],
      },
    ],
  },
  {
    label: "アイテム",
    subGroups: [
      {
        items: [{ id: "S1" }], // 今後新しい武器が増えたらここに id を足すだけ
      },
    ],
  },
  {
    label: "エネミー",
    subGroups: [
      {
        items: [{ id: "E1" }], // 今後新しい敵が増えたらここに id を足すだけ
      },
    ],
  },
];
