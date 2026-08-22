import * as Phaser from "phaser";
import { DoorManager } from "@/game-core/scenes/main/managers/DoorManager";

export interface ButtonConfig {
  /** 紐づけ用ID */
  targetId: string;
  /** アクティブのフレーム番号 */
  activeFrame?: number;
  /** 非アクティブのフレーム番号 */
  inactiveFrame?: number;
  /** レバースイッチ用フラグ */
  isOneTime?: boolean;
}

export class Button extends Phaser.Physics.Arcade.Sprite {
  public readonly id: string;
  public readonly targetId: string;

  private doorManager: DoorManager;
  private isPressed: boolean = false;
  private wasPressedThisFrame: boolean = false;
  private isOneTime: boolean;

  private activeFrame: number;
  private inactiveFrame: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    doorManager: DoorManager,
    config: ButtonConfig,
  ) {
    super(scene, x, y, texture);

    this.id = id;
    this.targetId = config.targetId;
    this.doorManager = doorManager;
    this.isOneTime = config.isOneTime ?? false;
    this.activeFrame = config.activeFrame ?? 1;
    this.inactiveFrame = config.inactiveFrame ?? 0;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // 重ね合わせ判定用

    this.setFrame(this.inactiveFrame);

    // 毎フレームの末尾で離れたかどうかのフラグチェックを行うイベント登録
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.postUpdateCheck, this);

    // オブジェクト破棄時のクリーンアップ
    this.on(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.postUpdateCheck, this);
    });
  }

  /**
   * プレイヤーや石などがボタンに乗っている間、毎フレーム呼び出される処理
   */
  public onOverlap(): void {
    this.wasPressedThisFrame = true;

    if (!this.isPressed) {
      this.isPressed = true;
      this.setFrame(this.activeFrame);
      this.doorManager.activateTarget(this.targetId);
    }
  }

  /**
   * overlapが発生したかを検証する
   */
  private postUpdateCheck(): void {
    // 押しっぱなし固定の場合は離れた判定を行わない
    if (this.isOneTime && this.isPressed) {
      this.wasPressedThisFrame = false;
      return;
    }

    // 押されている状態でoverlapが呼ばれていなければ離れたと判断
    if (this.isPressed && !this.wasPressedThisFrame) {
      this.isPressed = false;
      this.setFrame(this.inactiveFrame);
      this.doorManager.deactivateTarget(this.targetId);
    }

    // 次フレーム用にフラグをリセット
    this.wasPressedThisFrame = false;
  }

  /**
   * 現在押されているか
   */
  public isCurrentlyPressed(): boolean {
    return this.isPressed;
  }
}
