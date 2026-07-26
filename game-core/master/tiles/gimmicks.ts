import { TileConfig, TILE_CATEGORIES } from "@/game-core/types/tiles";

export const GIMMICK_TILES = {
  R1: {
    name: "石",
    category: TILE_CATEGORIES.STONE,
    texture: "stone",
    stoneData: { id: "S_NORMAL", stoneType: "NORMAL", element: "STONE" },
  },
  R3: {
    name: "氷",
    category: TILE_CATEGORIES.STONE,
    texture: "iceStone",
    stoneData: { id: "S_ICE", stoneType: "NORMAL", element: "ICE" },
  },
  R5: {
    name: "壊れる石",
    category: TILE_CATEGORIES.STONE,
    texture: "stoneBreakable",
    stoneData: { id: "S_BREAKABLE", stoneType: "BREAKABLE", element: "STONE" },
  },
  R6: {
    name: "壊れる氷",
    category: TILE_CATEGORIES.STONE,
    texture: "iceStoneBreakable",
    stoneData: { id: "S_BREAKABLE_ICE", stoneType: "BREAKABLE", element: "ICE" },
  },
  R7: {
    name: "重い石",
    category: TILE_CATEGORIES.STONE,
    texture: "heavyStone",
    stoneData: { id: "S_HEAVY", stoneType: "HEAVY", element: "STONE" },
  },
  R8: {
    name: "とげとげ石",
    category: TILE_CATEGORIES.STONE,
    texture: "spikyStone",
    stoneData: { id: "S_SPIKY", stoneType: "SPIKE", element: "STONE" },
  },
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
