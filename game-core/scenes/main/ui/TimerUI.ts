import * as Phaser from "phaser";

export class TimerUI {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private timeText!: Phaser.GameObjects.Text;
  private timeContainer!: Phaser.GameObjects.Graphics;
  private timeLabel!: Phaser.GameObjects.Text;

  // レイアウト用のパラメータ
  private rectW = 190;
  private rectH = 55;
  private rectY = 20;

  constructor(scene: Phaser.Scene, timeLimit: number) {
    this.scene = scene;
    this.createUI(timeLimit);
  }

  // MainSceneからコンテナを受け取るためのgetter
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  private createUI(timeLimit: number) {
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(200);
    this.container.setScrollFactor(0);

    this.timeContainer = this.scene.add.graphics();
    this.container.add(this.timeContainer);

    this.timeLabel = this.scene.add.text(0, 0, "TIME", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#94a3b8",
    });
    this.container.add(this.timeLabel);

    this.timeText = this.scene.add
      .text(0, 0, timeLimit.toFixed(3), {
        fontFamily: "monospace",
        fontSize: "30px",
        color: "#00ffcc",
        fontStyle: "bold",
      })
      .setOrigin(1, 0);
    this.container.add(this.timeText);

    this.layout();
  }

  /**
   * 画面幅の変化に合わせて再配置
   */
  public layout() {
    const uiCam = (this.scene as any).uiCamera;
    const viewWidth = uiCam ? uiCam.width : this.scene.scale.width;
    const rectX = viewWidth - this.rectW - 20;

    this.timeContainer.clear();
    this.timeContainer.fillStyle(0x000000, 0.8);
    this.timeContainer.lineStyle(1, 0x00ffcc, 0.3);
    this.timeContainer.fillRoundedRect(rectX, this.rectY, this.rectW, this.rectH, 8);
    this.timeContainer.strokeRoundedRect(rectX, this.rectY, this.rectW, this.rectH, 8);

    if (this.timeLabel) {
      this.timeLabel.setPosition(rectX + 15, this.rectY + 22);
    }

    if (this.timeText) {
      this.timeText.setPosition(rectX + this.rectW - 15, this.rectY + 10);
    }
  }

  public update(timeLeft: number) {
    if (this.timeText) {
      this.timeText.setText(timeLeft.toFixed(3));
    }
  }
}
