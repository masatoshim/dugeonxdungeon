import * as Phaser from "phaser";
import { EntityData, LevelGroups } from "@/game-core/types";
import { TILE_CONFIG } from "@/game-core/master";
import { TILE_SIZE } from "@/game-core/types";
import { Player } from "@/game-core/entities/Player";
import { Door } from "@/game-core/entities/Door";
import { DirectionalDoor } from "@/game-core/entities/DirectionalDoor";
import { LimitedDoor } from "@/game-core/entities/LimitedDoor";
import { Button } from "@/game-core/entities/Button";
import { LeverSwitch } from "@/game-core/entities/LeverSwitch";
import { MessageManager } from "@/game-core/scenes/main/managers/MessageManager";

export class DoorManager {
  private targetDoors = new Map<string, Door>();

  constructor(private scene: Phaser.Scene) {}

  /**
   * エディタで配置された扉、鍵、ボタン、レバースイッチを生成し、接続関係を構築する
   */
  public createDoorGimmicks(scene: Phaser.Scene, entities: EntityData[] = [], levelGroups: LevelGroups) {
    if (!entities || !Array.isArray(entities)) return [];

    // 扉の生成
    entities
      .filter((e) => e.tileId === "GBD" || e.tileId === "GKD" || e.tileId === "GLSD")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];

        const door = new Door(
          scene,
          e.x * TILE_SIZE + TILE_SIZE / 2,
          e.y * TILE_SIZE + TILE_SIZE / 2,
          config.texture!,
          e.id, // targetId（扉自体のID）
          {
            openFrame: config.openFrame ?? 1,
            closedFrame: 0,
            isLocked: config.isLocked,
          },
        );

        this.registerTarget(door);

        levelGroups.doors.add(door);
      });

    // 一方通行扉の生成
    entities
      .filter((e) => e.tileId === "GDDL" || e.tileId === "GDDR" || e.tileId === "GDDU" || e.tileId === "GDDD")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];
        const direction = config.allowedDirection ?? "DOWN";

        const door = new DirectionalDoor(
          scene,
          e.x * TILE_SIZE + TILE_SIZE / 2,
          e.y * TILE_SIZE + TILE_SIZE / 2,
          config.texture!,
          e.id,
          {
            allowedDirection: direction,
            openFrame: config.openFrame ?? 1,
            closedFrame: 0,
          },
        );

        levelGroups.doors.add(door);
      });

    // カウントダウン扉の生成
    entities
      .filter((e) => e.tileId === "GDC3" || e.tileId === "GDC6")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];

        const door = new LimitedDoor(
          scene,
          e.x * TILE_SIZE + TILE_SIZE / 2,
          e.y * TILE_SIZE + TILE_SIZE / 2,
          config.texture!,
          config.maxCount!,
        );

        levelGroups.doors.add(door);
      });

    // ボタンの生成
    entities
      .filter((e) => e.tileId === "GB")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];
        const targetId = e.properties?.targetId ?? "";

        const button = new Button(
          scene,
          e.x * TILE_SIZE + TILE_SIZE / 2,
          e.y * TILE_SIZE + TILE_SIZE / 2,
          config.texture!,
          e.id,
          this,
          {
            targetId: targetId,
            activeFrame: config.openFrame ?? 1,
            inactiveFrame: 0,
            isOneTime: false,
          },
        );

        button.setDepth(1);

        levelGroups.buttonsGroup.add(button);
      });

    // レバースイッチの生成
    entities
      .filter((e) => e.tileId === "GLS")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];
        const targetId = e.properties?.targetId ?? "";

        const lever = new LeverSwitch(
          scene,
          e.x * TILE_SIZE + TILE_SIZE / 2,
          e.y * TILE_SIZE + TILE_SIZE / 2,
          config.texture!,
          e.id,
          this,
          {
            targetId: targetId,
            activeFrame: config.openFrame ?? 1,
            inactiveFrame: 0,
          },
        );

        lever.setDepth(1);

        levelGroups.leversGroup.add(lever, true);
      });

    // カギの生成
    entities
      .filter((e) => e.tileId === "GK")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];

        const keyItem = scene.physics.add.staticSprite(
          e.x * TILE_SIZE + TILE_SIZE / 2,
          e.y * TILE_SIZE + TILE_SIZE / 2,
          config.texture!,
          0,
        );

        keyItem.setData("config", {
          ...config,
          item: {
            ...config.item,
            id: e.id,
            targetDoorId: e.properties?.targetId, // 扉との紐付け
          },
        });

        levelGroups.items.add(keyItem);
      });
  }

  /**
   * ギミックのターゲットを登録する
   */
  public registerTarget(targetDoor: Door): void {
    if (!targetDoor.id) {
      return;
    }
    this.targetDoors.set(targetDoor.id, targetDoor);
  }

  /**
   * 登録済みターゲットの取得
   */
  public getTarget(targetId: string): Door | undefined {
    return this.targetDoors.get(targetId);
  }

  /**
   * トリガー起動時の処理
   */
  public activateTarget(targetId: string): void {
    const targetDoor = this.targetDoors.get(targetId);
    if (targetDoor) {
      targetDoor.activate();
    } else {
      // console.warn(`GimmickTarget with ID '${targetId}' not found.`);
    }
  }

  /**
   * トリガー解除時の処理（ボタン用）
   */
  public deactivateTarget(targetId: string): void {
    const targetDoor = this.targetDoors.get(targetId);
    if (targetDoor) {
      targetDoor.deactivate();
    }
  }

  /**
   * ターゲットの状態を反転させる（レバースイッチ用）
   */
  public toggleTarget(targetId: string): void {
    const targetDoor = this.targetDoors.get(targetId);
    if (targetDoor) {
      targetDoor.toggle();
    }
  }

  /**
   * 管理情報のクリア
   */
  public clear(): void {
    this.targetDoors.clear();
  }

  public handleDoorCollision(player: Player, door: Door) {
    if (door instanceof DirectionalDoor) {
      return;
    }
    if (door instanceof LimitedDoor) {
      return;
    }
    // 鍵扉のチェック処理
    if (door.isActive()) return;
    const doorId = door.id;
    // 該当する扉の鍵を持っているか確認
    if (player.hasKeyFor(doorId)) {
      // 扉を開ける
      this.activateTarget(doorId);
      // 使った鍵を削除
      player.useKeyFor(doorId);
    } else {
      if (player.hasKey()) {
        MessageManager.getInstance().notify("持ってる鍵じゃ開かないみたい…");
      } else {
        MessageManager.getInstance().notify("扉は固く閉ざされている");
      }
    }
  }
}
