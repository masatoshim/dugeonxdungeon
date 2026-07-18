// core
import playerImg from "@/game-core/assets/core/player.png";
import playerSwordImg from "@/game-core/assets/core/player-sword.png";
import goalImg from "@/game-core/assets/core/goal.png";
import wallImg from "@/game-core/assets/core/wall.png";
import wallbreakable1Img from "@/game-core/assets/core/wall-breakable-1.png";
import wallbreakable2Img from "@/game-core/assets/core/wall-breakable-2.png";
import wallbreakable3Img from "@/game-core/assets/core/wall-breakable-3.png";
import emptyImg from "@/game-core/assets/core/empty.png";
import floorImg from "@/game-core/assets/core/floor.png";

// gimmicks
import stoneImg from "@/game-core/assets/gimmicks/stone.png";
import stoneBreakableImg from "@/game-core/assets/gimmicks/stone-breakable.png";
import iceStoneImg from "@/game-core/assets/gimmicks/ice-stone.png";
import iceStoneBreakableImg from "@/game-core/assets/gimmicks/ice-stone-breakable.png";
import heavyStoneImg from "@/game-core/assets/gimmicks/heavy-stone.png";
import buttonDoorImg from "@/game-core/assets/gimmicks/button-door.png";
import buttonTriggerImg from "@/game-core/assets/gimmicks/button-trigger.png";
import keySilverImg from "@/game-core/assets/gimmicks/key-silver.png";
import keySilverDoorImg from "@/game-core/assets/gimmicks/key-silver-door.png";

// items
import weaponSwordImg from "@/game-core/assets/items/weapon-sword.png";
import weaponSwordAttackEffectImg from "@/game-core/assets/items/weapon-sword-attack-effect.png";
import jewel1Img from "@/game-core/assets/items/jewel_1.png";

// enemies
import slimeImg from "@/game-core/assets/enemies/slime.png";
import slimeBA2Img from "@/game-core/assets/enemies/slime_bA2.png";
import slimeBA3Img from "@/game-core/assets/enemies/slime_bA3.png";
import blackManImg from "@/game-core/assets/enemies/blackMan.png";

export const ASSETS = {
  // core
  player: playerImg.src,
  playerSword: playerSwordImg.src,
  goal: goalImg.src,
  wall: wallImg.src,
  wallbreakable1: wallbreakable1Img.src,
  wallbreakable2: wallbreakable2Img.src,
  wallbreakable3: wallbreakable3Img.src,
  empty: emptyImg.src,
  floor: floorImg.src,

  // gimmicks
  stone: stoneImg.src,
  stoneBreakable: stoneBreakableImg.src,
  iceStone: iceStoneImg.src,
  iceStoneBreakable: iceStoneBreakableImg.src,
  heavyStone: heavyStoneImg.src,
  buttonDoor: buttonDoorImg.src,
  buttonTrigger: buttonTriggerImg.src,
  keySilver: keySilverImg.src,
  keySilverDoor: keySilverDoorImg.src,

  // items
  weaponSword: weaponSwordImg.src,
  weaponSwordAttackEffect: weaponSwordAttackEffectImg.src,
  jewel1: jewel1Img.src,

  // enemies
  slime: slimeImg.src,
  slimeBA2: slimeBA2Img.src,
  slimeBA3: slimeBA3Img.src,
  blackMan: blackManImg.src,
} as const;

export type AssetKey = keyof typeof ASSETS;
