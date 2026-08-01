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
        items: [
          { id: "W" },
          // { id: "BW1" },
          { id: "BW2" },
          { id: "BW3" },
        ],
      },
    ],
  },
  {
    label: "ギミック",
    subGroups: [
      {
        subLabel: "いろんな石",
        items: [{ id: "R1" }, { id: "R5" }, { id: "R3" }, { id: "R6" }, { id: "R7" }, { id: "R8" }],
      },
      {
        subLabel: "いろんなブロック",
        items: [{ id: "BR" }, { id: "BL" }, { id: "BU" }, { id: "BD" }, { id: "BH" }, { id: "BV" }],
      },
      {
        subLabel: "ボタンと扉",
        items: [{ id: "B1" }, { id: "D1" }],
      },
      {
        subLabel: "カギと扉",
        items: [{ id: "K1" }, { id: "KD1" }],
      },
      {
        subLabel: "単方向ワープ",
        items: [{ id: "WI1" }, { id: "WO1" }],
      },
      {
        subLabel: "双方向ワープ",
        items: [{ id: "WT1" }, { id: "WT2" }],
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
    label: "てき",
    subGroups: [
      {
        items: [
          // { id: "E1" },
          { id: "E2" },
          { id: "E3" },
          { id: "EC1" },
          { id: "EC2" },
          { id: "EB1" },
          { id: "ER1" },
          { id: "EG1" },
          { id: "EO1" },
          { id: "EO2" },
          { id: "EDO" },
          { id: "EDR" },
        ],
      },
    ],
  },
];
