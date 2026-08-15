import * as Phaser from "phaser";

export class Door extends Phaser.Physics.Arcade.Sprite {
  public readonly id: string;
  private isOpened: boolean = false;
  private openFrame: number;
  private closedFrame: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    config: { isLocked?: boolean; openFrame?: number; closedFrame?: number } = {},
  ) {
    super(scene, x, y, texture);

    this.id = id;
    this.openFrame = config.openFrame ?? 1;
    this.closedFrame = config.closedFrame ?? 0;

    this.isOpened = false;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.updateStateVisual();
  }

  public activate(): void {
    if (this.isOpened) return;
    this.isOpened = true;
    this.updateStateVisual();
  }

  public deactivate(): void {
    if (!this.isOpened) return;
    this.isOpened = false;
    this.updateStateVisual();
  }

  public toggle(): void {
    if (this.isOpened) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  public isActive(): boolean {
    return this.isOpened;
  }

  /**
   * 状態に応じた見た目と物理ボディの更新
   */
  private updateStateVisual(): void {
    const staticBody = this.body as Phaser.Physics.Arcade.StaticBody;

    if (this.isOpened) {
      this.setFrame(this.openFrame);
      this.setAlpha(0.3);
      if (staticBody) staticBody.enable = false; // 通過可能
    } else {
      this.setFrame(this.closedFrame);
      this.setAlpha(1.0);
      if (staticBody) staticBody.enable = true; // 通行不可
    }
  }
}
