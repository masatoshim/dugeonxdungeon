import * as Phaser from "phaser";
import { AssetKey } from "@/game-core/master";
import { EnemyData } from "@/game-core/types";
import { MainScene } from "../scenes/MainScene";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private moveEvent!: Phaser.Time.TimerEvent;
  private enemyData: EnemyData;
  private animKeyPrefix: string;
  private player?: Phaser.Physics.Arcade.Sprite; // プレイヤーの位置を把握

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
    this.setBounce(0, 0);
    this.setDrag(0);

    // 敵固有のアニメーション登録
    this.setupAnimations();

    this.moveEvent = scene.time.addEvent({
      delay: 10,
      callback: this.changeDirection,
      callbackScope: this,
      loop: true,
    });
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
          frameRate: this.enemyData.frameRate || 10,
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
            frameRate: this.enemyData.frameRate || 10,
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

    // 壁にぶつかった瞬間の緊急ターン
    if (this.enemyData.moveType === "HORIZONTAL") {
      if (this.body.blocked.left || this.body.touching.left || this.body.blocked.right || this.body.touching.right) {
        this.changeDirection();
      }
    }

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
    const moveSteps = this.enemyData.moveSteps || 1;

    if (this.enemyData.moveType === "HORIZONTAL") {
      if (this.getData("isMovingLeft") === undefined) {
        const startLeft = Phaser.Math.RND.pick([true, false]);
        this.setData("isMovingLeft", startLeft);
      }
      // 壁への接触判定
      if (this.body.blocked.left || this.body.touching.left) {
        this.setVelocityX(speed);
        this.setData("isMovingLeft", false);
      } else if (this.body.blocked.right || this.body.touching.right) {
        this.setVelocityX(-speed);
        this.setData("isMovingLeft", true);
      } else {
        // moveSteps分移動した時
        // そのまま進むか、反転するかをランダムで決定
        const currentMoveLeft = this.getData("isMovingLeft");
        const shouldTurn = Phaser.Math.RND.pick([true, false]);
        if (shouldTurn) {
          // 現在の進行方向と逆にする
          if (currentMoveLeft) {
            this.setVelocityX(-speed);
            this.setData("isMovingLeft", false);
          } else {
            this.setVelocityX(speed);
            this.setData("isMovingLeft", true);
          }
        } else {
          //現在の進行方向をそのまま維持
          if (currentMoveLeft) {
            this.setVelocityX(speed);
          } else {
            this.setVelocityX(-speed);
          }
          this.setData("isMovingLeft", currentMoveLeft);
        }
      }
      // 低速度フリーズ対策の安全バッファを含めたタイマーリセット
      const nextDelay = ((moveSteps * 32) / speed) * 1000 + 100;
      this.moveEvent.reset({
        delay: nextDelay,
        callback: this.changeDirection,
        callbackScope: this,
        loop: true,
      });
    } else if (this.enemyData.moveType === "RANDOM") {
      // 4方向ランダム移動
      const dir = Phaser.Math.RND.pick([
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]);
      this.setVelocity(dir[0] * speed, dir[1] * speed);
      // ディレイ設定
      const nextDelay = moveSteps > 0 ? ((moveSteps * 32) / speed) * 1000 : Phaser.Math.Between(1000, 2000);
      this.moveEvent.reset({
        delay: nextDelay,
        callback: this.changeDirection,
        callbackScope: this,
        loop: true,
      });
    } else if (this.enemyData.moveType === "CHASE") {
      const mainScene = this.scene as MainScene;
      const currentPlayer = mainScene.getPlayer();
      if (!currentPlayer || !currentPlayer.active) {
        this.setVelocity(0, 0);
        return;
      }
      // プレイヤーとの距離・方向を計算
      const diffX = currentPlayer.x - this.x;
      const diffY = currentPlayer.y - this.y;
      // 敵の移動速度
      const speed = this.enemyData.speed || 50;
      // 進みたい方向
      let moveX = Math.sign(diffX);
      let moveY = Math.sign(diffY);
      // 物理ボディの衝突状態をチェック
      const blocked = this.body.blocked;
      // X軸方向の壁にぶつかっている場合
      const isBlockedX = (moveX > 0 && blocked.right) || (moveX < 0 && blocked.left);
      // Y軸方向の壁にぶつかっている場合
      const isBlockedY = (moveY > 0 && blocked.down) || (moveY < 0 && blocked.up);
      if (isBlockedX && !isBlockedY) {
        // X軸が壁で詰まったら、強制的にY軸方向へ移動をシフト
        moveX = 0;
        if (moveY === 0) moveY = 1;
      } else if (isBlockedY && !isBlockedX) {
        // Y軸が壁で詰まったら、強制的にX軸方向へ移動をシフト
        moveY = 0;
        if (moveX === 0) moveX = 1;
      }
      if (moveX !== 0 && moveY !== 0) {
        // 斜め移動の速度調整
        this.setVelocity(moveX * speed * 0.5, moveY * speed * 0.5);
      } else {
        this.setVelocity(moveX * speed, moveY * speed);
      }
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
      return this.enemyData.score;
    } else {
      this.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        if (this.active) this.clearTint();
      });
      return 0;
    }
  }

  public getEnemyData() {
    return this.enemyData;
  }
}
