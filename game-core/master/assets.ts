// core
import playerImg from "@/game-core/assets/core/player.png";
import playerSwordImg from "@/game-core/assets/core/player-sword.png";
import playerBrokenSwordImg from "@/game-core/assets/core/player-broken_sword.png";
import goalImg from "@/game-core/assets/core/goal.png";
import wallImg from "@/game-core/assets/core/wall.png";
import wallbreakable1Img from "@/game-core/assets/core/wall-breakable-1.png";
import wallbreakable2Img from "@/game-core/assets/core/wall-breakable-2.png";
import wallbreakable3Img from "@/game-core/assets/core/wall-breakable-3.png";
import emptyImg from "@/game-core/assets/core/empty.png";
import floorImg from "@/game-core/assets/core/floor.png";
import colorWallRedImg from "@/game-core/assets/core/color_wall_red.png";
import colorWallBlueImg from "@/game-core/assets/core/color_wall_blue.png";
import colorWallYellowImg from "@/game-core/assets/core/color_wall_yellow.png";
import colorWallGreenImg from "@/game-core/assets/core/color_wall_green.png";

// gimmicks
import stoneImg from "@/game-core/assets/gimmicks/stone.png";
import stoneBreakableImg from "@/game-core/assets/gimmicks/stone-breakable.png";
import iceStoneImg from "@/game-core/assets/gimmicks/ice-stone.png";
import iceStoneBreakableImg from "@/game-core/assets/gimmicks/ice-stone-breakable.png";
import heavyStoneImg from "@/game-core/assets/gimmicks/heavy-stone.png";
import spikyStoneImg from "@/game-core/assets/gimmicks/spiky-stone.png";
import buttonDoorImg from "@/game-core/assets/gimmicks/button-door.png";
import buttonTriggerImg from "@/game-core/assets/gimmicks/button-trigger.png";
import keySilverImg from "@/game-core/assets/gimmicks/key-silver.png";
import keySilverDoorImg from "@/game-core/assets/gimmicks/key-silver-door.png";
import warpInImg from "@/game-core/assets/gimmicks/warp_in.png";
import warpOutImg from "@/game-core/assets/gimmicks/warp_out.png";
import warpTwoWay1Img from "@/game-core/assets/gimmicks/warp_two_way1.png";
import warpTwoWay2Img from "@/game-core/assets/gimmicks/warp_two_way2.png";
import blockRightImg from "@/game-core/assets/gimmicks/block_right.png";
import blockLeftImg from "@/game-core/assets/gimmicks/block_left.png";
import blockUpImg from "@/game-core/assets/gimmicks/block_up.png";
import blockDownImg from "@/game-core/assets/gimmicks/block_down.png";
import blockHorizontalImg from "@/game-core/assets/gimmicks/block_horizontal.png";
import blockVerticalImg from "@/game-core/assets/gimmicks/block_vertical.png";
import colorBlockRedImg from "@/game-core/assets/gimmicks/color_block_red.png";
import colorBlockBlueImg from "@/game-core/assets/gimmicks/color_block_blue.png";
import colorBlockYellowImg from "@/game-core/assets/gimmicks/color_block_yellow.png";
import colorBlockGreenImg from "@/game-core/assets/gimmicks/color_block_green.png";
import leverSwitchImg from "@/game-core/assets/gimmicks/lever_switch.png";
import leverSwitchDoorImg from "@/game-core/assets/gimmicks/lever_switch_door.png";

// items
import weaponSwordImg from "@/game-core/assets/items/weapon-sword.png";
import weaponBrokenSwordImg from "@/game-core/assets/items/weapon-broken_sword.png";
import weaponSwordAttackEffectImg from "@/game-core/assets/items/weapon-sword-attack-effect.png";
import jewel1Img from "@/game-core/assets/items/jewel_1.png";
import jewel2Img from "@/game-core/assets/items/jewel_2.png";

// enemies
import slimeImg from "@/game-core/assets/enemies/slime.png";
import slimeBA2Img from "@/game-core/assets/enemies/slime_bA2.png";
import slimeBA3Img from "@/game-core/assets/enemies/slime_bA3.png";
import blackManImg from "@/game-core/assets/enemies/blackMan.png";
import redEyeDiceImg from "@/game-core/assets/enemies/red_eye_dice.png";
import flameRed1Img from "@/game-core/assets/enemies/flame_red1.png";
import flameBlue1Img from "@/game-core/assets/enemies/flame_blue1.png";
import doppel1Img from "@/game-core/assets/enemies/doppel1.png";
import ghost1Img from "@/game-core/assets/enemies/ghost1.png";
import akaoniImg from "@/game-core/assets/enemies/akaoni.png";
import aooniImg from "@/game-core/assets/enemies/aooni.png";
import dragonImg from "@/game-core/assets/enemies/dragon.png";
import dragonRedImg from "@/game-core/assets/enemies/dragon_red.png";
import fireBallImg from "@/game-core/assets/enemies/fire-ball.png";
import shadowImg from "@/game-core/assets/enemies/shadow.png";
import munchkinImg from "@/game-core/assets/enemies/munchkin.png";
import golemImg from "@/game-core/assets/enemies/golem.png";
import cannonImg from "@/game-core/assets/enemies/cannon.png";
import cannonBallImg from "@/game-core/assets/enemies/cannon_ball.png";
import stepImg from "@/game-core/assets/enemies/step.png";

export const ASSETS = {
  // core
  player: playerImg.src,
  playerSword: playerSwordImg.src,
  playerBrokenSword: playerBrokenSwordImg.src,
  goal: goalImg.src,
  wall: wallImg.src,
  wallbreakable1: wallbreakable1Img.src,
  wallbreakable2: wallbreakable2Img.src,
  wallbreakable3: wallbreakable3Img.src,
  empty: emptyImg.src,
  floor: floorImg.src,
  colorWallRed: colorWallRedImg.src,
  colorWallBlue: colorWallBlueImg.src,
  colorWallYellow: colorWallYellowImg.src,
  colorWallGreen: colorWallGreenImg.src,

  // gimmicks
  stone: stoneImg.src,
  stoneBreakable: stoneBreakableImg.src,
  iceStone: iceStoneImg.src,
  iceStoneBreakable: iceStoneBreakableImg.src,
  heavyStone: heavyStoneImg.src,
  spikyStone: spikyStoneImg.src,
  buttonDoor: buttonDoorImg.src,
  buttonTrigger: buttonTriggerImg.src,
  keySilver: keySilverImg.src,
  keySilverDoor: keySilverDoorImg.src,
  warpIn: warpInImg.src,
  warpOut: warpOutImg.src,
  warpTwoWay1: warpTwoWay1Img.src,
  warpTwoWay2: warpTwoWay2Img.src,
  blockRight: blockRightImg.src,
  blockLeft: blockLeftImg.src,
  blockUp: blockUpImg.src,
  blockDown: blockDownImg.src,
  blockHorizontal: blockHorizontalImg.src,
  blockVertical: blockVerticalImg.src,
  colorBlockRed: colorBlockRedImg.src,
  colorBlockBlue: colorBlockBlueImg.src,
  colorBlockYellow: colorBlockYellowImg.src,
  colorBlockGreen: colorBlockGreenImg.src,
  leverSwitch: leverSwitchImg.src,
  leverSwitchDoor: leverSwitchDoorImg.src,

  // items
  weaponSword: weaponSwordImg.src,
  weaponBrokenSword: weaponBrokenSwordImg.src,
  weaponSwordAttackEffect: weaponSwordAttackEffectImg.src,
  jewel1: jewel1Img.src,
  jewel2: jewel2Img.src,

  // enemies
  slime: slimeImg.src,
  slimeBA2: slimeBA2Img.src,
  slimeBA3: slimeBA3Img.src,
  blackMan: blackManImg.src,
  redEyeDice: redEyeDiceImg.src,
  flameRed1: flameRed1Img.src,
  flameBlue1: flameBlue1Img.src,
  doppel1: doppel1Img.src,
  ghost1: ghost1Img.src,
  akaoni: akaoniImg.src,
  aooni: aooniImg.src,
  dragon: dragonImg.src,
  dragonRed: dragonRedImg.src,
  fireBall: fireBallImg.src,
  shadow: shadowImg.src,
  munchkin: munchkinImg.src,
  golem: golemImg.src,
  cannon: cannonImg.src,
  cannonBall: cannonBallImg.src,
  step: stepImg.src,
} as const;

export type AssetKey = keyof typeof ASSETS;
