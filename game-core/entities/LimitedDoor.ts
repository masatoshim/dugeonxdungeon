import Phaser from "phaser";

export class LimitedDoor extends Phaser.Physics.Arcade.Sprite {
  private maxCount: number;
  private remainingCount: number;
  private isPassing: boolean = false; // 通過中フラグ

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, maxCount: number) {
    /**
     * 用意する画像について
     * 通過可能回数(maxCount)が3の場合、一枚目から四枚目に数値が3、2、1、0の扉画像を設定
     * 五枚目に扉が開いた画像を設定
     */
    super(scene, x, y, texture, 0);

    this.maxCount = maxCount;
    this.remainingCount = maxCount;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // StaticBody

    this.updateFrame();
  }

  /**
   * 通過・離脱判定
   */
  public checkLimitedDoorPass(player: Phaser.GameObjects.Sprite): void {
    const doorBounds = this.getBounds();
    const strictDoorBounds = new Phaser.Geom.Rectangle(
      doorBounds.x + 4,
      doorBounds.y + 4,
      doorBounds.width - 8,
      doorBounds.height - 8,
    );

    const isOverlapping = Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), strictDoorBounds);

    if (isOverlapping) {
      if (!this.isPassing) {
        this.tryPass();
      }
    } else {
      if (this.isPassing) {
        this.closeAndDecrement();
      }
    }
  }

  /**
   * 通過可能か判定し、可能であれば扉を開く
   */
  public tryPass(): boolean {
    if (this.remainingCount <= 0 || this.isPassing) {
      return false;
    }
    this.open();
    return true;
  }

  /**
   * 扉を開く
   */
  public open() {
    this.isPassing = true;
    // あたり判定を無効化
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    if (body) {
      body.enable = false;
    }
    // 開いた画像フレームに切り替え
    this.setFrame(this.maxCount + 1);
  }

  /**
   * 扉を閉じてカウントをデクリメント
   */
  public closeAndDecrement() {
    if (!this.isPassing) return;
    this.isPassing = false;
    // カウントを1減らす
    if (this.remainingCount > 0) {
      this.remainingCount--;
    }
    // 閉じた画像＆新しいカウントのフレームに切り替え
    this.updateFrame();
    // 物理判定を再度有効化
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    if (body) {
      body.enable = true;
      body.updateFromGameObject();
    }
  }

  /**
   * 残りカウントに応じたフレーム切り替え
   */
  private updateFrame() {
    const frameNo = this.maxCount - this.remainingCount;
    this.setFrame(frameNo);
  }

  public getRemainingCount(): number {
    return this.remainingCount;
  }

  public getIsPassing(): boolean {
    return this.isPassing;
  }
}
