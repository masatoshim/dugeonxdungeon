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
  type: "WEAPON" | "LIGHT" | "KEY" | "CONSUMABLE";
  maxUses?: number;
  remainingUses?: number;
  weaponData?: WeaponData;
  targetDoorId?: string;
  canBreakWalls?: boolean;
  consumesOnUse?: boolean;
}

export interface PlayerInventory {
  weapon: Item | null;
  hasLight: boolean;
  keys: string[];
  items: Item[];
}
