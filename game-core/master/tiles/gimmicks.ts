import { TileConfig, TILE_CATEGORIES } from "../../types/tiles";

export const GIMMICK_TILES: Record<string, TileConfig> = {
  R1: { name: "石", category: TILE_CATEGORIES.STONE, texture: "stones", frame: 0 },
  R3: { name: "氷", category: TILE_CATEGORIES.ICE, texture: "stones", frame: 2 },
  B1: { name: "ボタン", category: TILE_CATEGORIES.GIMMICK, texture: "buttons", frame: 0, openFrame: 1 },
  D1: { name: "ボタン扉", category: TILE_CATEGORIES.GIMMICK, texture: "doors", frame: 1, openFrame: 0 },
  K1: {
    name: "鍵",
    category: TILE_CATEGORIES.GIMMICK,
    texture: "items",
    frame: 1,
    item: { id: "KEY_SILVER", name: "銀の鍵", type: "KEY", consumesOnUse: true },
  },
  KD1: { name: "鍵扉", category: TILE_CATEGORIES.GIMMICK, texture: "doors", frame: 3, openFrame: 2, isLocked: true },
};
