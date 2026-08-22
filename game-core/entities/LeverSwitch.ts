import * as Phaser from "phaser";
import { DoorManager } from "@/game-core/scenes/main/managers/DoorManager";

export interface LeverSwitchConfig {
  targetId: string;
  activeFrame?: number;
  inactiveFrame?: number;
}

export class LeverSwitch extends Phaser.Physics.Arcade.Sprite {
  public readonly id: string;
  private targetId: string;
  private doorManager: DoorManager;
  private isOn: boolean = false;
  private activeFrame: number;
  private inactiveFrame: number;

  // 連続切り替え防止フラグ
  private canToggle: boolean = true;
  private isPressed: boolean = false;
  private wasPressedThisFrame: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    doorManager: DoorManager,
    config: LeverSwitchConfig,
  ) {
    super(scene, x, y, texture);

    this.id = id;
    this.targetId = config.targetId;
    this.doorManager = doorManager;
    this.activeFrame = config.activeFrame ?? 1;
    this.inactiveFrame = config.inactiveFrame ?? 0;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // 重ね合わせ判定用

    this.setFrame(this.inactiveFrame);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    if (body) {
      body.setSize(this.width, this.height);
      this.refreshBody(); // ★ this（Sprite）の refreshBody を呼び出す
    }

    // 毎フレームの末尾で離れたかどうかのフラグチェックを行うイベント登録
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.postUpdateCheck, this);

    // オブジェクト破棄時のクリーンアップ
    this.on(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.postUpdateCheck, this);
    });
  }

  /**
   * プレイヤーと接触した際に呼び出す処理
   */
  public onOverlap(): void {
    this.wasPressedThisFrame = true;

    // 重なり続けている間、またはトグル不可状態ならスキップ
    if (!this.canToggle || this.isPressed) return;

    this.isPressed = true;
    this.canToggle = false; // 重なり中は再トリガーをブロック

    // 状態を反転
    this.invertState();
  }

  /**
   * 重なりが解消された時に呼び出し
   */
  public resetToggle(): void {
    this.canToggle = true;
  }

  /**
   * overlapが発生したかを検証する
   */
  private postUpdateCheck(): void {
    // プレイヤーが離れた場合
    if (!this.wasPressedThisFrame) {
      this.isPressed = false;
      this.canToggle = true; // 次回接触したときに再び切り替え可能にする
    }

    // 次フレーム用にフラグをリセット
    this.wasPressedThisFrame = false;
  }

  /**
   * 状態を反転
   */
  public invertState(): void {
    this.isOn = !this.isOn;
    this.setFrame(this.isOn ? this.activeFrame : this.inactiveFrame);
    this.doorManager.toggleTarget(this.targetId);
  }
}
