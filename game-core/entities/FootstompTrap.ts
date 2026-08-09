import Phaser from "phaser";
import { MainScene } from "@/game-core/scenes/main/MainScene";

export class FootstompTrap extends Phaser.Physics.Arcade.Sprite {
  private mainScene: MainScene;
  private timerEvent?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, rotationAngle: number, duration: number) {
    super(scene, x, y, texture);
    this.mainScene = scene as MainScene;

    // スプライトの原点を中央に設定
    this.setOrigin(0.5, 0.5);

    // シーンに追加
    scene.add.existing(this);

    // 静的物理ボディとして登録
    scene.physics.add.existing(this, true);

    // 回転を適用
    this.setAngle(rotationAngle);
    this.setDepth(1);

    // 物理ボディのサイズと位置を中心座標に合わせて手動調整
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    if (body) {
      body.setSize(32, 32);
      // 物理ボディの中心座標を指定して再配置
      body.center.set(x, y);
      body.position.x = x - body.halfWidth;
      body.position.y = y - body.halfHeight;
    }

    // グループに追加
    const trapsGroup = this.mainScene.getFootstompTraps();
    trapsGroup.add(this);

    // タイマー設定
    if (duration > 0) {
      this.timerEvent = scene.time.delayedCall(duration, () => {
        this.destroyTrap();
      });
    }
  }

  public destroyTrap() {
    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    this.mainScene.getFootstompTraps().remove(this, false, false);

    if (this.body) {
      this.body.enable = false;
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
