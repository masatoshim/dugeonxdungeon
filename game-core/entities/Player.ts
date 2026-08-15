import * as Phaser from "phaser";
import { WeaponData, PlayerInventory } from "@/game-core/types";
import { MessageManager } from "@/game-core/scenes/main/managers/MessageManager";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private arcadeBody: Phaser.Physics.Arcade.Body;

  // プレイヤーの方向を示すプロパティ
  private lastFacing: { x: number; y: number } = { x: 0, y: 1 };

  // インベントリの初期化
  private inventory: PlayerInventory = {
    weapon: null,
    hasLight: false,
    keys: [],
    items: [],
  };

  private score = 0;
  // 現在の装備
  private currentWeapon: WeaponData | null = null;
  private isAttacking: boolean = false;

  // 操作用
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey: Phaser.Input.Keyboard.Key;
  private lastDirection: { x: number; y: number } = { x: 0, y: 1 };
  private attackCallback?: (
    x: number,
    y: number,
    direction: { x: number; y: number },
    currentWeapon: WeaponData,
  ) => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.arcadeBody = this.body as Phaser.Physics.Arcade.Body;

    // 物理設定
    this.arcadeBody.setCollideWorldBounds(true);
    this.setMass(0.5);

    this.setBodySize(20, 24); // Todo: 適切なプレイヤーサイズに
    this.setOffset(6, 8);

    // 入力設定
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // アニメーションの生成
    this.createAnimations();
  }

  /**
   * プレイヤーのアニメーションを一括登録
   */
  private createAnimations() {
    // 重複登録防止ガード
    if (this.scene.anims.exists("player-walk-down")) return;

    const animsConfig = [
      // 通常状態
      { key: "player-walk-down", texture: "player", frames: [0, 1, 0, 2] },
      { key: "player-walk-left", texture: "player", frames: [3, 4, 3, 5] },
      { key: "player-walk-right", texture: "player", frames: [6, 7, 6, 8] },
      { key: "player-walk-up", texture: "player", frames: [9, 10, 9, 11] },

      // 剣装備状態
      { key: "player-sword-walk-down", texture: "playerSword", frames: [0, 1, 0, 2] },
      { key: "player-sword-walk-left", texture: "playerSword", frames: [3, 4, 3, 5] },
      { key: "player-sword-walk-right", texture: "playerSword", frames: [6, 7, 6, 8] },
      { key: "player-sword-walk-up", texture: "playerSword", frames: [9, 10, 9, 11] },

      // 剣攻撃時
      { key: "player-sword-attack-down", texture: "playerSword", frames: [12], rate: 1, loop: 0 },
      { key: "player-sword-attack-left", texture: "playerSword", frames: [13], rate: 1, loop: 0 },
      { key: "player-sword-attack-right", texture: "playerSword", frames: [14], rate: 1, loop: 0 },
      { key: "player-sword-attack-up", texture: "playerSword", frames: [15], rate: 1, loop: 0 },

      // ぼろぼろの剣装備状態
      { key: "player-broken_sword-walk-down", texture: "playerBrokenSword", frames: [0, 1, 0, 2] },
      { key: "player-broken_sword-walk-left", texture: "playerBrokenSword", frames: [3, 4, 3, 5] },
      { key: "player-broken_sword-walk-right", texture: "playerBrokenSword", frames: [6, 7, 6, 8] },
      { key: "player-broken_sword-walk-up", texture: "playerBrokenSword", frames: [9, 10, 9, 11] },

      // ぼろぼろの剣攻撃時
      { key: "player-broken_sword-attack-down", texture: "playerBrokenSword", frames: [12], rate: 1, loop: 0 },
      { key: "player-broken_sword-attack-left", texture: "playerBrokenSword", frames: [13], rate: 1, loop: 0 },
      { key: "player-broken_sword-attack-right", texture: "playerBrokenSword", frames: [14], rate: 1, loop: 0 },
      { key: "player-broken_sword-attack-up", texture: "playerBrokenSword", frames: [15], rate: 1, loop: 0 },
    ];

    animsConfig.forEach((cfg) => {
      this.scene.anims.create({
        key: cfg.key,
        frames: this.scene.anims.generateFrameNumbers(cfg.texture, { frames: cfg.frames }),
        frameRate: cfg.rate ?? 12,
        repeat: cfg.loop ?? -1,
      });
    });
  }

  // 鍵の管理用メソッドを更新
  public addKey(targetDoorId: string) {
    (this.inventory.keys as any as string[]).push(targetDoorId);
  }

  public hasKeyFor(doorId: string): boolean {
    return (this.inventory.keys as any as string[]).includes(doorId);
  }

  public useKeyFor(doorId: string) {
    const keys = this.inventory.keys as any as string[];
    const index = keys.indexOf(doorId);
    if (index > -1) {
      keys.splice(index, 1);
    }
  }

  // スコア追加
  public addScore(score: number) {
    this.score += score;
  }
  // スコア取得
  public getScore() {
    return this.score;
  }

  public setOnAttack(callback: (x: number, y: number, dir: { x: number; y: number }, weapon: WeaponData) => void) {
    this.attackCallback = callback;
  }

  update() {
    if (this.isAttacking) {
      this.arcadeBody.setVelocity(0);
      return;
    }

    const speed = 80; // Todo: 適切な移動スピードに
    this.arcadeBody.setVelocity(0);

    // 移動入力
    if (this.cursors.left.isDown) {
      this.arcadeBody.setVelocityX(-speed);
      this.lastDirection = { x: -1, y: 0 };
    } else if (this.cursors.right.isDown) {
      this.arcadeBody.setVelocityX(speed);
      this.lastDirection = { x: 1, y: 0 };
    }

    if (this.cursors.up.isDown) {
      this.arcadeBody.setVelocityY(-speed);
      this.lastDirection = { x: 0, y: -1 };
    } else if (this.cursors.down.isDown) {
      this.arcadeBody.setVelocityY(speed);
      this.lastDirection = { x: 0, y: 1 };
    }

    if (this.arcadeBody.velocity.length() > 0) {
      this.arcadeBody.velocity.normalize().scale(speed);
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.executeAttack();
      return;
    }

    // 動的なプレフィックスを取得
    const prefix = this.getAnimPrefix();

    // アニメーション制御
    if (this.arcadeBody.velocity.x < 0) {
      this.anims.play(`${prefix}walk-left`, true);
    } else if (this.arcadeBody.velocity.x > 0) {
      this.anims.play(`${prefix}walk-right`, true);
    } else if (this.arcadeBody.velocity.y < 0) {
      this.anims.play(`${prefix}walk-up`, true);
    } else if (this.arcadeBody.velocity.y > 0) {
      this.anims.play(`${prefix}walk-down`, true);
    } else {
      this.anims.stop();

      // 静止時のフレーム制御
      if (this.lastDirection.x === 0 && this.lastDirection.y === 1) {
        this.setFrame(0);
      } else if (this.lastDirection.x === 0 && this.lastDirection.y === -1) {
        this.setFrame(9);
      } else if (this.lastDirection.x === 1 && this.lastDirection.y === 0) {
        this.setFrame(6);
      } else if (this.lastDirection.x === -1 && this.lastDirection.y === 0) {
        this.setFrame(3);
      }
    }
  }

  /**
   * 装備状態に応じたアニメーションのプレフィックスを返す
   */
  private getAnimPrefix(): string {
    if (this.currentWeapon) {
      return `player-${this.currentWeapon.id.toLowerCase()}-`;
    }
    return "player-";
  }

  private executeAttack() {
    if (!this.currentWeapon || this.isAttacking) return;

    this.isAttacking = true;

    // 現在の武器プレフィックスを使用して攻撃モーションを再生
    const prefix = this.getAnimPrefix();
    if (this.lastDirection.x === 0 && this.lastDirection.y === 1) {
      this.anims.play(`${prefix}attack-down`);
    } else if (this.lastDirection.x === 0 && this.lastDirection.y === -1) {
      this.anims.play(`${prefix}attack-up`);
    } else if (this.lastDirection.x === 1 && this.lastDirection.y === 0) {
      this.anims.play(`${prefix}attack-right`);
    } else if (this.lastDirection.x === -1 && this.lastDirection.y === 0) {
      this.anims.play(`${prefix}attack-left`);
    }

    if (this.attackCallback) {
      this.attackCallback(this.x, this.y, this.lastDirection, this.currentWeapon);
    }

    // クールダウン後に攻撃状態を解除し、正しい向きの静止フレームに戻す
    const attackCooldown = this.currentWeapon?.cooldown ?? 300;
    this.scene.time.delayedCall(attackCooldown, () => {
      this.isAttacking = false;
      if (this.active) {
        this.anims.stop();
        if (this.lastDirection.x === 0 && this.lastDirection.y === 1) this.setFrame(0);
        else if (this.lastDirection.x === 0 && this.lastDirection.y === -1) this.setFrame(9);
        else if (this.lastDirection.x === 1 && this.lastDirection.y === 0) this.setFrame(6);
        else if (this.lastDirection.x === -1 && this.lastDirection.y === 0) this.setFrame(3);
      }
    });
  }

  public equipWeapon(weapon: WeaponData) {
    this.currentWeapon = weapon;
    // インベントリ側も更新しておく
    this.inventory.weapon = {
      id: weapon.id,
      name: weapon.name,
      type: "WEAPON",
      weaponData: weapon,
    };
  }

  /**
   * 武器を破壊/解除する
   */
  public breakWeapon() {
    const weaponName = this.currentWeapon?.name;
    this.currentWeapon = null;
    this.inventory.weapon = null;
    MessageManager.getInstance().notify(`${weaponName}が壊れてしまった！`);
  }

  /**
   * 武器の耐久値を減らし、0になったら破壊する
   */
  public consumeWeaponDurability() {
    if (!this.currentWeapon || this.currentWeapon.durability === undefined) return;

    this.currentWeapon.durability -= 1;
    if (this.currentWeapon.durability <= 0) {
      this.breakWeapon();
    }
  }

  // プレイヤーが現在向いている正規化ベクトルを返す
  public getFacingVector(): { x: number; y: number } {
    if (this.body && (this.body.velocity.x !== 0 || this.body.velocity.y !== 0)) {
      const len = Math.hypot(this.body.velocity.x, this.body.velocity.y);
      this.lastFacing = {
        x: this.body.velocity.x / len,
        y: this.body.velocity.y / len,
      };
    }
    return this.lastFacing;
  }

  /**
   * 現在押されている移動キーの方向ベクトルを取得
   */
  public getInputDirection(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.cursors) {
      if (this.cursors.left.isDown) x = -1;
      else if (this.cursors.right.isDown) x = 1;

      if (this.cursors.up.isDown) y = -1;
      else if (this.cursors.down.isDown) y = 1;
    }

    return { x, y };
  }
}
