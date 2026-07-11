import * as Phaser from "phaser";
import { AssetKey } from "@/game-core/master";
import { EnemyData } from "@/game-core/types";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private moveEvent: Phaser.Time.TimerEvent;
  private enemyData: EnemyData;
  private animKeyPrefix: string;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: AssetKey, frame: number, enemyData: EnemyData) {
    super(scene, x, y, texture, frame);

    this.enemyData = enemyData;
    this.animKeyPrefix = `anim-${this.enemyData.id.toLowerCase()}`;

    // シーンへの追加と物理エンジンの有効化
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // ボディサイズの同期
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(this.enemyData.xsize || this.width, this.enemyData.ysize || this.height);
      body.setOffset(this.enemyData.xoffset || 0, this.enemyData.yoffset || 0);
      this.setCollideWorldBounds(true);
    }

    // 初期ステータス設定
    this.setData("hp", this.enemyData.hp);
    this.setBounce(1, 1); // 壁に当たった時に100%の速度で跳ね返る
    this.setDrag(0); // 摩擦で減速しない

    // 敵固有のアニメーション登録
    this.setupAnimations();

    // 2秒ごとに移動方向を変える
    this.moveEvent = scene.time.addEvent({
      delay: Phaser.Math.Between(1000, 2000),
      callback: this.changeDirection,
      callbackScope: this,
      loop: true,
    });

    this.changeDirection();
  }

  /**
   * 敵固有のアニメーション設定
   */
  private setupAnimations() {
    const anims = this.scene.anims;

    if (this.enemyData.animType === "SINGLE" || !this.enemyData.animType) {
      if (!anims.exists(this.animKeyPrefix)) {
        anims.create({
          key: this.animKeyPrefix,
          frames: anims.generateFrameNumbers(this.texture.key, { start: 0, end: (this.enemyData.animSize || 1) - 1 }),
          frameRate: 10,
          repeat: -1,
        });
      }

      // シンクロを回避するロジック
      const totalFrames = anims.get(this.animKeyPrefix).frames.length;
      const randomStartFrame = Phaser.Math.Between(0, totalFrames - 1);
      this.play({ key: this.animKeyPrefix, startFrame: randomStartFrame });
    } else if (this.enemyData.animType === "DIRECTIONAL") {
      const directions = [
        { suffix: "down", frames: [0, 1, 0, 2] },
        { suffix: "left", frames: [3, 4, 3, 5] },
        { suffix: "right", frames: [6, 7, 6, 8] },
        { suffix: "up", frames: [9, 10, 9, 11] },
      ];

      directions.forEach((d) => {
        const key = `${this.animKeyPrefix}-${d.suffix}`;
        if (!anims.exists(key)) {
          anims.create({
            key: key,
            frames: anims.generateFrameNumbers(this.texture.key, { frames: d.frames }),
            frameRate: 6,
            repeat: -1,
          });
        }
      });

      const defaultKey = `${this.animKeyPrefix}-down`;
      const totalFrames = anims.get(defaultKey).frames.length;
      const randomStartFrame = Phaser.Math.Between(0, totalFrames - 1);
      this.play({ key: defaultKey, startFrame: randomStartFrame });
    }
  }

  public update() {
    if (!this.active || !this.body) return;

    // DIRECTIONAL（方向持ち）の敵のみ、速度から判断してアニメーションを上書きする
    if (this.enemyData.animType === "DIRECTIONAL") {
      const vx = this.body.velocity.x;
      const vy = this.body.velocity.y;

      if (Math.abs(vx) > Math.abs(vy)) {
        if (vx > 0) this.anims.play(`${this.animKeyPrefix}-right`, true);
        else if (vx < 0) this.anims.play(`${this.animKeyPrefix}-left`, true);
      } else {
        if (vy > 0) this.anims.play(`${this.animKeyPrefix}-down`, true);
        else if (vy < 0) this.anims.play(`${this.animKeyPrefix}-up`, true);
      }
    }
  }

  /**
   * 移動方向の変更
   */
  private changeDirection() {
    if (!this.active || !this.body) return;

    const speed = this.enemyData.speed || 50;

    if (this.enemyData.moveType === "HORIZONTAL") {
      // 左右に往復
      if (this.body.velocity.x === 0) {
        this.setVelocityX(speed);
      } else {
        this.setVelocityX(-this.body.velocity.x);
      }
    } else if (this.enemyData.moveType === "RANDOM") {
      // 4方向ランダム移動
      const dir = Phaser.Math.RND.pick([
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]);
      this.setVelocity(dir[0] * speed, dir[1] * speed);
    }
  }

  /**
   * ダメージ処理
   */
  public takeDamage(amount: number) {
    let hp = this.getData("hp") - amount;
    this.setData("hp", hp);

    if (hp <= 0) {
      this.moveEvent.destroy();
      this.destroy();
    } else {
      this.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        if (this.active) this.clearTint();
      });
    }
  }
}
