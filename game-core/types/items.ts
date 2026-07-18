export interface WeaponData {
  id: string;
  name: string;
  range: number;
  size: number;
  damage: number;
  cooldown: number;
}

export interface Item {
  id: string;
  name: string;
  type: "WEAPON" | "KEY" | "SCORE_ITEM";
  maxUses?: number;
  remainingUses?: number;
  weaponData?: WeaponData;
  targetDoorId?: string;
  canBreakWalls?: boolean;
  consumesOnUse?: boolean;
  score?: number;
}

export interface PlayerInventory {
  weapon: Item | null;
  hasLight: boolean;
  keys: string[];
  items: Item[];
}
