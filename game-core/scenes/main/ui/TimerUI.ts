import * as Phaser from "phaser";

export class TimerUI {
  private scene: Phaser.Scene;
  private timeText!: Phaser.GameObjects.Text;
  private timeContainer!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, timeLimit: number) {
    this.scene = scene;
    this.createUI(timeLimit);
  }

  private createUI(timeLimit: number) {
    const { width } = this.scene.scale;

    this.timeContainer = this.scene.add.graphics();
    this.timeContainer.fillStyle(0x000000, 0.8);
    this.timeContainer.lineStyle(1, 0x00ffcc, 0.3);

    const rectX = width - 210;
    const rectY = 20;
    const rectW = 190;
    const rectH = 55;
    this.timeContainer.fillRoundedRect(rectX, rectY, rectW, rectH, 8);
    this.timeContainer.strokeRoundedRect(rectX, rectY, rectW, rectH, 8);
    this.timeContainer.setScrollFactor(0).setDepth(200);

    this.scene.add
      .text(rectX + 15, rectY + 22, "TIME", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#94a3b8",
      })
      .setScrollFactor(0)
      .setDepth(201);

    this.timeText = this.scene.add
      .text(width - 30, rectY + 10, timeLimit.toFixed(3), {
        fontFamily: "monospace",
        fontSize: "30px",
        color: "#00ffcc",
        fontStyle: "bold",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(201);
  }

  public update(timeLeft: number) {
    if (this.timeText) {
      this.timeText.setText(timeLeft.toFixed(3));
    }
  }
}
