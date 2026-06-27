// core
import playerImg from "@/game-core/assets/core/player.png";
import goalImg from "@/game-core/assets/core/goal.png";
import wallImg from "@/game-core/assets/core/wall.png";
import wallbreakable1Img from "@/game-core/assets/core/wall-breakable-1.png";
import wallbreakable3Img from "@/game-core/assets/core/wall-breakable-3.png";
import emptyImg from "@/game-core/assets/core/empty.png";

// gimmicks
import stoneImg from "@/game-core/assets/gimmicks/stone.png";
import iceStoneImg from "@/game-core/assets/gimmicks/ice-stone.png";
import heavyStoneImg from "@/game-core/assets/gimmicks/heavy-stone.png";
import buttonDoorImg from "@/game-core/assets/gimmicks/button-door.png";
import buttonTriggerImg from "@/game-core/assets/gimmicks/button-trigger.png";
import keySilverImg from "@/game-core/assets/gimmicks/key-silver.png";
import keySilverDoorImg from "@/game-core/assets/gimmicks/key-silver-door.png";

// items
import weaponSwordImg from "@/game-core/assets/items/weapon-sword.png";

// enemies
import slimeImg from "@/game-core/assets/enemies/slime.png";

export const ASSETS = {
  // core
  player: playerImg.src,
  goal: goalImg.src,
  wall: wallImg.src,
  wallbreakable1: wallbreakable1Img.src,
  wallbreakable3: wallbreakable3Img.src,
  empty: emptyImg.src,
  // gimmicks
  stone: stoneImg.src,
  iceStone: iceStoneImg.src,
  heavyStone: heavyStoneImg.src,
  buttonDoor: buttonDoorImg.src,
  buttonTrigger: buttonTriggerImg.src,
  keySilver: keySilverImg.src,
  keySilverDoor: keySilverDoorImg.src,
  // items
  weaponSword: weaponSwordImg.src,
  // enemies
  slime: slimeImg.src,
} as const;

export type AssetKey = keyof typeof ASSETS;
