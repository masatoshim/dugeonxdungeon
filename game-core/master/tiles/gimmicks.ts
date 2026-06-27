import { TileConfig, TILE_CATEGORIES } from "@/game-core/types/tiles";

export const GIMMICK_TILES = {
  R1: { name: "石", category: TILE_CATEGORIES.STONE, texture: "stone" },
  R3: { name: "氷", category: TILE_CATEGORIES.STONE, texture: "iceStone" },
  B1: { name: "ボタン", category: TILE_CATEGORIES.GIMMICK, texture: "buttonTrigger", openFrame: 1 },
  D1: { name: "ボタン扉", category: TILE_CATEGORIES.GIMMICK, texture: "buttonDoor", openFrame: 1 },
  K1: {
    name: "鍵",
    category: TILE_CATEGORIES.GIMMICK,
    texture: "keySilver",
    item: { id: "KEY_SILVER", name: "銀の鍵", type: "KEY", consumesOnUse: true },
  },
  KD1: {
    name: "鍵扉",
    category: TILE_CATEGORIES.GIMMICK,
    texture: "keySilverDoor",
    openFrame: 1,
    isLocked: true,
  },
} as const satisfies Record<string, TileConfig>;
