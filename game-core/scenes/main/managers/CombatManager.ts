import * as Phaser from "phaser";
import { WeaponData, EnemyData } from "@/game-core/types";
import { Player } from "@/game-core/entities/Player";
import { Enemy } from "@/game-core/entities/Enemy";
import { EnemyBullet } from "@/game-core/entities/EnemyBullet";
import { FootstompTrap } from "@/game-core/entities/FootstompTrap";
import { StoneManager } from "@/game-core/scenes/main/managers/StoneManager";
import { MessageManager } from "@/game-core/scenes/main/managers/MessageManager";

export class CombatManager {
  private scene: Phaser.Scene;
  private stoneManager: StoneManager;

  constructor(scene: Phaser.Scene, stoneManager: StoneManager) {
    this.scene = scene;
    this.stoneManager = stoneManager;
  }

  /**
   * 攻撃ヒット時の判定
   */
  public handleAttack(
    player: Player,
    x: number,
    y: number,
    direction: { x: number; y: number },
    weapon: WeaponData | undefined,
    movableStones: Phaser.Physics.Arcade.Group,
    enemies: Phaser.Physics.Arcade.Group,
    walls: Phaser.Physics.Arcade.StaticGroup,
    breakableWalls: Phaser.Physics.Arcade.StaticGroup,
    doors: Phaser.Physics.Arcade.StaticGroup,
    enemyBullets?: Phaser.Physics.Arcade.Group,
    footstompTraps?: Phaser.Physics.Arcade.StaticGroup,
  ) {
    const range = weapon ? weapon.range : 24;
    const size = weapon ? weapon.size : 20;
    const damage = weapon ? weapon.damage : 1;

    const attackX = x + direction.x * range;
    const attackY = y + direction.y * range;

    // 攻撃判定用の不可視オブジェクト
    const hitArea = this.scene.add.rectangle(attackX, attackY, size, size, 0xffff00, 0);
    this.scene.physics.add.existing(hitArea);

    // 空振りか命中かを判定するフラグ
    let hasHit = false;

    // エフェクトを画面に表示
    let effect: Phaser.GameObjects.Sprite | null = null;
    if (weapon?.id === "SWORD" || weapon?.id === "BROKEN_SWORD") {
      effect = this.scene.add.sprite(attackX, attackY, "weaponSwordAttackEffect");
    }
    if (effect) {
      if (direction.x === 1)
        effect.setAngle(270); // 右向き
      else if (direction.x === -1)
        effect.setAngle(90); // 左向き
      else if (direction.y === 1)
        effect.setAngle(0); // 下向き
      else if (direction.y === -1) effect.setAngle(180); // 上向き
    }

    // 石への攻撃
    this.scene.physics.overlap(hitArea, movableStones, (_, stoneObject) => {
      const stone = stoneObject as Phaser.Physics.Arcade.Sprite;
      if (stone.getData("isMoving")) return;

      const stoneType = stone.getData("stoneType");
      const element = stone.getData("element");

      if (stoneType === "BREAKABLE") {
        hasHit = true;
        this.stoneManager.breakStone(stone, element, movableStones);
        return;
      }

      if (["NORMAL", "HEAVY", "SPIKE"].includes(stoneType)) {
        hasHit = true;
        this.stoneManager.moveStoneByAttack(stone, direction, enemies, walls, breakableWalls, doors, movableStones);
      }
    });

    // 敵へのダメージ
    this.scene.physics.overlap(hitArea, enemies, (_, target) => {
      if (target instanceof Enemy) {
        hasHit = true;
        const enemyData: EnemyData = target.getEnemyData();
        // ムテキてきには攻撃が効かない
        if (enemyData.isInvincible) {
          MessageManager.getInstance().notify(`攻撃がきかない！`);
          return;
        }

        // 倒したら、スコア追加
        const score: number = target.takeDamage(damage);
        if (score > 0) {
          player.addScore(score);
          MessageManager.getInstance().notify(`${enemyData.name}を倒した！！`);
        } else {
          MessageManager.getInstance().notify(`${enemyData.name}に${damage}のダメージ！！`);
        }
      }
    });

    // 壊れる壁へのダメージ
    this.scene.physics.overlap(hitArea, breakableWalls, (_, wall) => {
      hasHit = true;
      this.handleObjectDamage(wall as Phaser.GameObjects.Sprite);
    });

    // 敵の弾をかき消す判定
    if (enemyBullets) {
      this.scene.physics.overlap(hitArea, enemyBullets, (_, bulletObject) => {
        if (bulletObject instanceof EnemyBullet) {
          hasHit = true;
          bulletObject.destroy();
        }
      });
    }

    // 足跡トラップの消去判定
    if (footstompTraps && weapon) {
      this.scene.physics.overlap(hitArea, footstompTraps, (_, trapObj) => {
        if (trapObj instanceof FootstompTrap) {
          // 装備している武器のIDで足跡が消去可能かチェック
          if (trapObj.tryClearWithItem(weapon.id)) {
            hasHit = true;
          }
        }
      });
    }

    // 何かに命中した場合のみ、耐久度を減らす（耐久度設定がある武器のみ）
    if (hasHit) {
      player.consumeWeaponDurability();
    }

    // 判定オブジェクトとエフェクト画像を一定時間後に一緒に消去する
    this.scene.time.delayedCall(100, () => {
      hitArea.destroy();
      if (effect) effect.destroy();
    });
  }

  /**
   * 壁などの汎用ダメージ処理
   */
  private handleObjectDamage(target: Phaser.GameObjects.Sprite) {
    const hp = target.getData("hp") - 1;
    if (hp <= 0) {
      target.destroy();
    } else {
      target.setData("hp", hp);
      target.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => target.clearTint());
      this.scene.tweens.add({ targets: target, x: target.x + 2, duration: 50, yoyo: true });
    }
  }
}
