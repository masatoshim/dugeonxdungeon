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
          // { id: "WB1" },
          { id: "WB2" },
          // { id: "WB3" },
          { id: "CWR" },
          { id: "CWB" },
          { id: "CWY" },
          { id: "CWG" },
        ],
      },
    ],
  },
  {
    label: "ギミック",
    subGroups: [
      {
        subLabel: "いろんな石",
        items: [{ id: "ST" }, { id: "STB" }, { id: "STI" }, { id: "STIB" }, { id: "STH" }, { id: "STS" }],
      },
      {
        subLabel: "いろんなブロック",
        items: [
          { id: "BLR" },
          { id: "BLL" },
          { id: "BLU" },
          { id: "BLD" },
          { id: "BLH" },
          { id: "BLV" },
          { id: "CBLR" },
          { id: "CBLB" },
          { id: "CBLY" },
          { id: "CBLG" },
          { id: "BLC3" },
        ],
      },
      {
        subLabel: "ボタンと扉",
        items: [{ id: "GB" }, { id: "GBD" }],
      },
      {
        subLabel: "カギと扉",
        items: [{ id: "GK" }, { id: "GKD" }],
      },
      {
        subLabel: "レバースイッチと扉",
        items: [{ id: "GLS" }, { id: "GLSD" }],
      },
      {
        subLabel: "いろんな扉",
        items: [{ id: "GDDL" }, { id: "GDDR" }, { id: "GDDU" }, { id: "GDDD" }, { id: "GDC3" }],
      },
      {
        subLabel: "単方向ワープ",
        items: [{ id: "GWI" }, { id: "GWO" }],
      },
      {
        subLabel: "双方向ワープ",
        items: [{ id: "GWT1" }, { id: "GWT2" }],
      },
    ],
  },
  {
    label: "アイテム",
    subGroups: [
      {
        items: [{ id: "S1" }, { id: "S2" }, { id: "J1" }, { id: "J2" }],
      },
    ],
  },
  {
    label: "てき",
    subGroups: [
      {
        items: [
          // { id: "E1" },
          { id: "ES2" },
          { id: "ES3" },
          { id: "EIB" },
          { id: "EIR" },
          { id: "EF" },
          { id: "EIF" },
          { id: "EDO" },
          { id: "EG" },
          { id: "EOR" },
          { id: "EOB" },
          { id: "EDR" },
          { id: "EDRR" },
          { id: "ESH" },
          { id: "EM" },
          { id: "EFS" },
          { id: "EGO" },
          { id: "ECC" },
          { id: "EBO" },
        ],
      },
    ],
  },
];
