import * as Phaser from "phaser";

export class TimerUI {
  private scene: Phaser.Scene;
  private timeText!: Phaser.GameObjects.Text;
  private timeContainer!: Phaser.GameObjects.Graphics;

  // レイアウト用のパラメータ
  private rectW = 190;
  private rectH = 55;
  private rectY = 20;

  constructor(scene: Phaser.Scene, timeLimit: number) {
    this.scene = scene;
    this.createUI(timeLimit);
  }

  private createUI(timeLimit: number) {
    // グラフィックの作成
    this.timeContainer = this.scene.add.graphics();
    this.timeContainer.setScrollFactor(0).setDepth(200);

    // ラベルの作成
    this.scene.add
      .text(0, 0, "TIME", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#94a3b8",
      })
      .setScrollFactor(0)
      .setDepth(201)
      .setName("timeLabel"); // 後から参照・位置調整できるように名前を付与

    // タイマー数値テキストの作成
    this.timeText = this.scene.add
      .text(0, 0, timeLimit.toFixed(3), {
        fontFamily: "monospace",
        fontSize: "30px",
        color: "#00ffcc",
        fontStyle: "bold",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(201);

    // 初回レイアウト調整
    this.layout();
  }

  /**
   * 画面幅の変化に合わせて再配置
   */
  public layout() {
    const viewWidth = this.scene.cameras.main.width;

    const rectX = viewWidth - this.rectW - 20; // 右端余白

    // 背景の描き直し
    this.timeContainer.clear();
    this.timeContainer.fillStyle(0x000000, 0.8);
    this.timeContainer.lineStyle(1, 0x00ffcc, 0.3);
    this.timeContainer.fillRoundedRect(rectX, this.rectY, this.rectW, this.rectH, 8);
    this.timeContainer.strokeRoundedRect(rectX, this.rectY, this.rectW, this.rectH, 8);

    // ラベルの位置更新
    const label = this.scene.children.getByName("timeLabel") as Phaser.GameObjects.Text;
    if (label) {
      label.setPosition(rectX + 15, this.rectY + 22);
    }

    // 数値テキストの位置更新
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
