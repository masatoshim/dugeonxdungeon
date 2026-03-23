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
  targetDoorId?: string; // 鍵が対応する扉のID
  canBreakWalls?: boolean; // 特定のカテゴリの壁を壊せるかなどのフラグ
  consumesOnUse?: boolean; // 使用時に消費するか（鍵など）
}

export interface PlayerInventory {
  weapon: Item | null;
  hasLight: boolean;
  keys: string[];
  items: Item[];
}
