import tilesetImg from "@/game-core/assets/tileset.png";
import stonesImg from "@/game-core/assets/stones.png";
import doorsImg from "@/game-core/assets/doors.png";
import buttonsImg from "@/game-core/assets/buttons.png";
import itemsImg from "@/game-core/assets/items.png";
import playerImg from "@/game-core/assets/player.png";
import enemiesImg from "@/game-core/assets/enemies.png";

export const ASSETS = {
  tileset: tilesetImg.src,
  stones: stonesImg.src,
  doors: doorsImg.src,
  buttons: buttonsImg.src,
  items: itemsImg.src,
  player_idle: playerImg.src,
  enemies: enemiesImg.src,
} as const;

// game-core\assets\buttons.png
