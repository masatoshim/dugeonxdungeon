import * as Phaser from "phaser";
import { AssetKey } from "@/game-core/master";
import { EnemyData } from "@/game-core/types";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public moveEvent?: Phaser.Time.TimerEvent;
  private enemyData: EnemyData;
  private animKeyPrefix: string;

  // CHASE_2（感知・追尾）用の追跡状態フラグと現在の向き
  public isChasing2: boolean = false;
  private currentFacing: { x: number; y: number } = { x: 0, y: 1 };

  // CHASE_3（感知・直進）用のフラグと方向ベクトル（正規化された正確な方向ベクトル）
  public isChasing3: boolean = false;
  public chase3Direction: { x: number; y: number } = { x: 0, y: 0 };
  public nextSearchableTime: number = 0;

  // RANGED（感知・遠隔攻撃）用の遠隔攻撃用の状態プロパティ
  public rangedState: "IDLE" | "PREPARE" | "ATTACK" | "COOLDOWN" = "IDLE";
  public lastRangedAttackTime: number = 0;

  // 足跡用のプロパティ
  public lastTileX: number | null = null;
  public lastTileY: number | null = null;
  public footstompFrameIndex: number = 0;

  // ダメージ復帰タイマー
  private stunTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: AssetKey, frame: number, enemyData: EnemyData) {
    super(scene, x, y, texture, frame);

    this.enemyData = enemyData;
    this.animKeyPrefix = `anim-${this.enemyData.id.toLowerCase()}-${this.texture.key}`;

    // シーンへの追加と物理エンジンの有効化
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setupPhysics();
    this.setData("hp", this.enemyData.hp);
    this.setupAnimations();
  }

  /**
   * ボディサイズの同期
   */
  private setupPhysics(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(this.enemyData.xsize || this.width, this.enemyData.ysize || this.height);
      body.setOffset(this.enemyData.xoffset || 0, this.enemyData.yoffset || 0);
      this.setCollideWorldBounds(true);
      this.setDepth(2);

      // プレイヤーに押されないように固定
      this.setImmovable(true);
      body.pushable = false;
    }

    // GHOSTタイプの敵は障害物の当たり判定を無効化
    if (this.enemyData.isGhost && body) {
      this.setBounce(0, 0);
      this.setDepth(5);
      body.checkCollision.up = false;
      body.checkCollision.down = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;
    }

    // 初期ステータス設定
    this.setBounce(0, 0);
    this.setDrag(0);
  }

  /**
   * 敵固有のアニメーション登録
   */
  private setupAnimations(): void {
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
    } else if (this.enemyData.animType.startsWith("DIRECTIONAL")) {
      const directionsMap: Record<string, { suffix: string; frames: number[] }[]> = {
        DIRECTIONAL: [
          { suffix: "down", frames: [0, 1, 0, 2] },
          { suffix: "left", frames: [3, 4, 3, 5] },
          { suffix: "right", frames: [6, 7, 6, 8] },
          { suffix: "up", frames: [9, 10, 9, 11] },
        ],
        DIRECTIONAL_2: [
          { suffix: "down", frames: [0, 1, 2, 1] },
          { suffix: "left", frames: [3, 4, 5, 4] },
          { suffix: "right", frames: [6, 7, 8, 7] },
          { suffix: "up", frames: [9, 10, 11, 10] },
        ],
        DIRECTIONAL_3: [
          { suffix: "down", frames: [0] },
          { suffix: "left", frames: [1] },
          { suffix: "right", frames: [2] },
          { suffix: "up", frames: [3] },
        ],
        DIRECTIONAL_4: [
          { suffix: "down", frames: [0, 1, 2, 1] },
          { suffix: "left", frames: [3, 4, 5, 6, 7, 8] },
          { suffix: "right", frames: [10, 11, 12, 13, 14] },
          { suffix: "up", frames: [15, 16, 17, 16] },
        ],
        DIRECTIONAL_5: [
          { suffix: "down", frames: [0, 2, 1] },
          { suffix: "left", frames: [3, 5, 4] },
          { suffix: "right", frames: [6, 8, 7] },
          { suffix: "up", frames: [9, 11, 10] },
        ],
      };
      const directions = directionsMap[this.enemyData.animType] || directionsMap["DIRECTIONAL"];

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

  /**
   * 指定した方向（dx, dy）に向き直し、アニメーションと視界ベクトルを更新する
   */
  public setFacingDirection(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;

    // 正規化して視界ベクトルを設定
    const len = Math.hypot(dx, dy);
    this.currentFacing = { x: dx / len, y: dy / len };

    if (!this.enemyData.animType?.startsWith("DIRECTIONAL")) return;

    let suffix = "down";
    if (Math.abs(dy) >= Math.abs(dx)) {
      suffix = dy > 0 ? "down" : "up";
    } else {
      suffix = dx > 0 ? "right" : "left";
    }

    const targetKey = `${this.animKeyPrefix}-${suffix}`;
    if (this.anims.currentAnim?.key !== targetKey) {
      this.anims.play(targetKey, true);
    }
  }

  /**
   * ダメージ処理
   */
  public takeDamage(amount: number): number {
    if (this.isStunned()) return 0;

    const hp = this.getData("hp") - amount;
    this.setData("hp", hp);

    if (hp <= 0) {
      this.cleanup();
      this.destroy();
      return this.enemyData.score;
    } else {
      this.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        if (this.active) this.clearTint();
      });

      // 敵の停止処理
      if (this.body) this.body.velocity.set(0, 0);
      this.pauseMoveTimer();

      // 連続被弾時は前の復帰タイマーをキャンセルしてスタン時間を上書き
      if (this.stunTimer) this.stunTimer.destroy();

      const duration = this.enemyData.stunDuration ?? 500;
      this.stunTimer = this.scene.time.delayedCall(duration, () => {
        if (!this.active) return;
        this.resumeMoveTimer();
      });

      return 0;
    }
  }

  public isStunned(): boolean {
    return this.stunTimer !== undefined && !this.stunTimer.hasDispatched;
  }

  public pauseMoveTimer(): void {
    if (this.moveEvent) this.moveEvent.paused = true;
  }

  public resumeMoveTimer(): void {
    if (this.moveEvent) this.moveEvent.paused = false;
  }

  public cleanup(): void {
    if (this.stunTimer) this.stunTimer.destroy();
    if (this.moveEvent) this.moveEvent.destroy();
  }

  public getEnemyData(): EnemyData {
    return this.enemyData;
  }

  public getCurrentFacing(): { x: number; y: number } {
    return this.currentFacing;
  }
}
