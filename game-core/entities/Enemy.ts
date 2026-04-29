import * as Phaser from "phaser";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private moveEvent: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame: number, hp: number) {
    super(scene, x, y, texture, frame);

    // シーンへの追加と物理エンジンの有効化
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // --- 画像が表示されない対策：ボディサイズの同期 ---
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      // スプライトのテクスチャサイズに合わせて物理ボディを更新
      body.setSize(this.width, this.height);
      this.setCollideWorldBounds(true);
    }

    this.setData("hp", hp);
    this.setBounce(1, 1); // 壁に当たった時に100%の速度で跳ね返る
    this.setDrag(0); // 摩擦で減速しないようにする

    // AI: 2秒ごとに移動方向を変える
    this.moveEvent = scene.time.addEvent({
      delay: Phaser.Math.Between(500, 1000),
      callback: this.changeDirection,
      callbackScope: this,
      loop: true,
    });

    this.changeDirection();
  }

  // Enemy.ts の changeDirection を修正
  private changeDirection() {
    if (!this.active || !this.body) return;

    const data = this.getData("enemyData");
    const speed = data?.speed || 50;

    if (data?.moveType === "HORIZONTAL") {
      // 左右に往復（壁に当たったら反転などは物理エンジンの衝突判定で制御）
      if (this.body.velocity.x === 0) {
        this.setVelocityX(speed);
      } else {
        this.setVelocityX(-this.body.velocity.x);
      }
    } else {
      // 斜め移動も含めた8方向 + 停止なし
      const dir = Phaser.Math.RND.pick([
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1], // 上下左右
      ]);
      this.setVelocity(dir[0] * speed, dir[1] * speed);
    }
  }

  public takeDamage(amount: number) {
    const hp = this.getData("hp") - amount;
    this.setData("hp", hp);

    if (hp <= 0) {
      this.moveEvent.destroy();
      this.destroy();
    } else {
      this.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => this.clearTint());
    }
  }
}
