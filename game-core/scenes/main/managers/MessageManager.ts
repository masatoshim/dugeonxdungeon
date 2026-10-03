export interface ITargetPlayer {
  x: number;
  y: number;
  getDirection?: () => "up" | "down" | "left" | "right";
}

export class MessageManager {
  private static instance: MessageManager;
  private scene?: Phaser.Scene;
  private player?: ITargetPlayer;
  private container?: Phaser.GameObjects.Container;
  private bg?: Phaser.GameObjects.Graphics;
  private text?: Phaser.GameObjects.Text;
  private hideTimer?: Phaser.Time.TimerEvent;

  public static getInstance(): MessageManager {
    if (!MessageManager.instance) {
      MessageManager.instance = new MessageManager();
    }
    return MessageManager.instance;
  }

  // 向きに応じたオフセットを計算
  private calculatePosition(): { x: number; y: number } {
    const px = this.player ? this.player.x : (this.scene?.cameras.main.centerX ?? 0);
    const py = this.player ? this.player.y : (this.scene?.cameras.main.centerY ?? 0);

    // 向きを取得
    const direction =
      this.player && typeof (this.player as any).getDirection === "function"
        ? (this.player as any).getDirection()
        : "down";

    let offsetX = 0;
    let offsetY = 0;
    const distance = 40;

    switch (direction) {
      case "down": // 正面：プレイヤーの真上
        offsetY = -distance;
        break;
      case "up": // 背後：プレイヤーの真下
        offsetY = distance;
        break;
      case "left": // 左向き：プレイヤーの右上
        offsetX = distance * 1.5;
        offsetY = -distance * 1.0;
        break;
      case "right": // 右向き：プレイヤーの左上
        offsetX = -distance * 1.5;
        offsetY = -distance * 1.0;
        break;
      default:
        offsetY = -distance;
        break;
    }

    return { x: px + offsetX, y: py + offsetY };
  }

  public update(): void {
    if (!this.container || !this.container.visible || !this.player) return;
    const pos = this.calculatePosition();
    this.container.setPosition(pos.x, pos.y);
  }

  public init(scene: Phaser.Scene, player?: ITargetPlayer): void {
    this.scene = scene;
    this.player = player;

    if (this.container) {
      this.container.destroy();
    }

    this.container = scene.add.container(0, 0);
    this.container.setDepth(1000);

    this.bg = scene.add.graphics();
    this.container.add(this.bg);

    this.text = scene.add.text(0, 0, "", {
      fontSize: "14px",
      color: "#ffffff",
      align: "center",
    });
    this.text.setOrigin(0.5, 0.5);
    this.container.add(this.text);

    this.container.setVisible(false);
  }

  public setPlayer(player: ITargetPlayer): void {
    this.player = player;
  }

  public notify(message: string): void {
    // console.log(`[Message]: ${message}`);

    if (!this.scene || !this.container || !this.bg || !this.text) return;

    const pos = this.calculatePosition();
    this.container.setPosition(pos.x, pos.y);
    this.text.setText(message);

    const bounds = this.text.getBounds();
    const padding = 12;
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.8);
    this.bg.lineStyle(2, 0x4fd1d1, 1);
    this.bg.fillRoundedRect(
      -bounds.width / 2 - padding,
      -bounds.height / 2 - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2,
      8,
    );

    this.container.setVisible(true);

    if (this.hideTimer) {
      this.hideTimer.remove();
    }

    this.hideTimer = this.scene.time.delayedCall(1000, () => {
      this.container?.setVisible(false);
    });
  }
}
