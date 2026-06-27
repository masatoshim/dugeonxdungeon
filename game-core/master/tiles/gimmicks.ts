import { TileConfig, TILE_CATEGORIES } from "@/game-core/types/tiles";

export const GIMMICK_TILES: Record<string, TileConfig> = {
  R1: { name: "石", category: TILE_CATEGORIES.STONE, texture: "stone", frame: 0 },
  R3: { name: "氷", category: TILE_CATEGORIES.STONE, texture: "iceStone", frame: 0 },
  B1: { name: "ボタン", category: TILE_CATEGORIES.GIMMICK, texture: "buttonTrigger", frame: 0, openFrame: 1 },
  D1: { name: "ボタン扉", category: TILE_CATEGORIES.GIMMICK, texture: "buttonDoor", frame: 0, openFrame: 1 },
  K1: {
    name: "鍵",
    category: TILE_CATEGORIES.GIMMICK,
    texture: "keySilver",
    frame: 0,
    item: { id: "KEY_SILVER", name: "銀の鍵", type: "KEY", consumesOnUse: true },
  },
  KD1: {
    name: "鍵扉",
    category: TILE_CATEGORIES.GIMMICK,
    texture: "keySilverDoor",
    frame: 0,
    openFrame: 1,
    isLocked: true,
  },
};
