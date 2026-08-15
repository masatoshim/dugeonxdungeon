import * as Phaser from "phaser";
import { Player } from "@/game-core/entities/Player";
import { AllowedDirection } from "@/game-core/types";
import { TILE_SIZE } from "@/game-core/types";

export interface DirectionalDoorConfig {
  allowedDirection: AllowedDirection;
  openFrame?: number;
  closedFrame?: number;
}

export class DirectionalDoor extends Phaser.Physics.Arcade.Sprite {
  public readonly id: string;
  private allowedDirection: AllowedDirection;
  private openFrame: number;
  private closedFrame: number;
  public isOpened: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, id: string, config: DirectionalDoorConfig) {
    super(scene, x, y, texture);

    this.id = id;
    this.allowedDirection = config.allowedDirection;
    this.openFrame = config.openFrame ?? 1;
    this.closedFrame = config.closedFrame ?? 0;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static Body

    this.updateStateVisual();
  }

  /**
   * 通り抜け判定メソッド
   */
  public updatePassCheck(player: Player): void {
    // プレイヤーと扉の中心点からの距離
    const dx = player.x - this.x;
    const dy = player.y - this.y;

    if (!this.isOpened) {
      let canOpen = false;

      const openMargin = TILE_SIZE + 8;
      const alignMargin = 20; // 軸のズレ許容値

      switch (this.allowedDirection) {
        case "LEFT":
          canOpen = dx > 0 && dx < openMargin && Math.abs(dy) < alignMargin;
          break;
        case "RIGHT":
          canOpen = dx < 0 && dx > -openMargin && Math.abs(dy) < alignMargin;
          break;
        case "UP":
          canOpen = dy > 0 && dy < openMargin && Math.abs(dx) < alignMargin;
          break;
        case "DOWN":
          canOpen = dy < 8 && dy > -openMargin && Math.abs(dx) < alignMargin;
          break;
      }

      if (canOpen) {
        this.openDoor();
      }
    } else {
      let hasPassed = false;

      switch (this.allowedDirection) {
        case "LEFT":
          hasPassed = dx < -TILE_SIZE / 2 || dx > TILE_SIZE;
          break;
        case "RIGHT":
          hasPassed = dx > TILE_SIZE / 2 || dx < -TILE_SIZE;
          break;
        case "UP":
          hasPassed = dy < -TILE_SIZE / 2 || dy > TILE_SIZE;
          break;
        case "DOWN":
          hasPassed = dy > TILE_SIZE / 2 || dy < -TILE_SIZE;
          break;
      }

      if (hasPassed) {
        this.closeDoor();
      }
    }
  }

  public openDoor(): void {
    if (this.isOpened) return;
    this.isOpened = true;
    this.disableBody(true, false); // 物理壁を無効化
    this.updateStateVisual();
  }

  public closeDoor(): void {
    if (!this.isOpened) return;
    this.isOpened = false;
    this.enableBody(true, this.x, this.y, true, true); // 物理壁を復元
    this.updateStateVisual();
  }

  private updateStateVisual(): void {
    if (this.isOpened) {
      this.setFrame(this.openFrame);
      this.setAlpha(0.3);
    } else {
      this.setFrame(this.closedFrame);
      this.setAlpha(1.0);
    }
  }
}
