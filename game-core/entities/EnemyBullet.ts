import Phaser from "phaser";
import { BulletAnimConfig } from "@/game-core/types";

export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    dirX: number,
    dirY: number,
    speed: number,
    animConfig?: BulletAnimConfig,
  ) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 進行方向への回転設定
    const angle = Math.atan2(dirY, dirX) + Math.PI / 2;
    this.setRotation(angle);

    // アニメーションをセットアップ
    if (animConfig?.key) {
      this.setupAnimation(animConfig);
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setAllowGravity(false);

      // 当たり判定の設定
      if (animConfig?.bodyRadius) {
        // 円形判定
        body.setCircle(animConfig.bodyRadius);
        // オフセット設定
        const offsetX = animConfig.offsetX ? animConfig.offsetX : (this.width - animConfig.bodyRadius * 2) / 2;
        const offsetY = animConfig.offsetY ? animConfig.offsetY : (this.height - animConfig.bodyRadius * 2) / 2;
        body.setOffset(offsetX, offsetY);
      } else if (animConfig?.bodySize) {
        // 矩形判定
        body.setSize(animConfig.bodySize.width, animConfig.bodySize.height);
        // オフセット設定
        const offsetX = animConfig.offsetX ? animConfig.offsetX : (this.width - animConfig.bodySize.width) / 2;
        const offsetY = animConfig.offsetY ? animConfig.offsetY : (this.height - animConfig.bodySize.height) / 2;
        body.setOffset(offsetX, offsetY);
      }

      // 速度の設定
      const vec = new Phaser.Math.Vector2(dirX, dirY).normalize();
      body.setVelocity(vec.x * speed, vec.y * speed);
    }
  }

  /**
   * アニメーション登録・再生処理
   */
  private setupAnimation(animConfig: BulletAnimConfig) {
    if (!animConfig.key) return;

    const anims = this.scene.anims;

    // まだ登録されていなければ作成する
    if (!anims.exists(animConfig.key)) {
      anims.create({
        key: animConfig.key,
        frames: anims.generateFrameNumbers(animConfig.key, {
          start: 0,
          end: (animConfig.animSize || 1) - 1,
        }),
        frameRate: animConfig.frameRate || 10,
        repeat: -1, // 弾のアニメーションはループ再生
      });
    }

    // アニメーション再生
    this.play({ key: animConfig.key, startFrame: 0 });
  }
}
