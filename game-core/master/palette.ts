import { PaletteGroup } from "@/game-core/types/tiles";

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
        items: [{ id: "W" }, { id: "BW1" }, { id: "BW2" }, { id: "BW3" }],
      },
    ],
  },
  {
    label: "ギミック",
    subGroups: [
      {
        subLabel: "いろんな石",
        items: [{ id: "R1" }, { id: "R3" }, { id: "R5" }, { id: "R6" }, { id: "R7" }],
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
        items: [{ id: "S1" }, { id: "J1" }, { id: "J2" }],
      },
    ],
  },
  {
    label: "エネミー",
    subGroups: [
      {
        items: [{ id: "E1" }, { id: "E2" }, { id: "E3" }, { id: "EB1" }, { id: "EC1" }, { id: "EC2" }, { id: "ED1" }],
      },
    ],
  },
];
