import tilesetImg from "../assets/tileset.png";
import stonesImg from "../assets/stones.png";
import doorsImg from "../assets/doors.png";
import buttonsImg from "../assets/buttons.png";
import itemsImg from "../assets/items.png";
import playerImg from "../assets/player.png";
import enemiesImg from "../assets/enemies.png";

export const ASSETS = {
  tileset: tilesetImg.src,
  stones: stonesImg.src,
  doors: doorsImg.src,
  buttons: buttonsImg.src,
  items: itemsImg.src,
  player_idle: playerImg.src,
  enemies: enemiesImg.src,
} as const;
