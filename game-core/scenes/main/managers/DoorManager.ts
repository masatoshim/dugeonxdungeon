import * as Phaser from "phaser";
import { EntityData, LevelGroups } from "@/game-core/types";
import { TILE_CONFIG } from "@/game-core/master";
import { Player } from "@/game-core/entities/Player";
import { Door } from "@/game-core/entities/Door";
import { Button } from "@/game-core/entities/Button";

export class DoorManager {
  private targets = new Map<string, Door>();

  constructor(private scene: Phaser.Scene) {}

  /**
   * エディタで配置された扉、鍵、ボタン、レバースイッチを生成し、接続関係を構築する
   */
  public createGimmicks(scene: Phaser.Scene, entities: EntityData[] = [], groups: LevelGroups) {
    if (!entities || !Array.isArray(entities)) return [];

    // 扉の生成
    entities
      .filter((e) => e.tileId === "GBD" || e.tileId === "GKD" || e.tileId === "GLSD")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];

        const door = new Door(
          scene,
          e.x * 32 + 16,
          e.y * 32 + 16,
          config.texture!,
          e.id, // targetId（扉自体のID）
          {
            openFrame: config.openFrame ?? 1,
            closedFrame: 0,
            isLocked: config.isLocked,
          },
        );

        this.registerTarget(door);

        groups.doors.add(door);
      });

    // ボタンの生成
    entities
      .filter((e) => e.tileId === "GB")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];
        const targetId = e.properties?.targetId ?? "";

        const button = new Button(scene, e.x * 32 + 16, e.y * 32 + 16, config.texture!, e.id, this, {
          targetId: targetId,
          activeFrame: config.openFrame ?? 1,
          inactiveFrame: 0,
          isOneTime: false,
        });

        button.setDepth(1);

        groups.buttonsGroup.add(button);
      });

    // カギの生成
    entities
      .filter((e) => e.tileId === "GK")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];

        const keyItem = scene.physics.add.staticSprite(e.x * 32 + 16, e.y * 32 + 16, config.texture!, 0);

        keyItem.setData("config", {
          ...config,
          item: {
            ...config.item,
            id: e.id,
            targetDoorId: e.properties?.targetId, // 扉との紐付け
          },
        });

        groups.items.add(keyItem);
      });
  }

  /**
   * ギミックのターゲットを登録する
   */
  public registerTarget(target: Door): void {
    if (!target.id) {
      return;
    }
    this.targets.set(target.id, target);
  }

  /**
   * 登録済みターゲットの取得
   */
  public getTarget(targetId: string): Door | undefined {
    return this.targets.get(targetId);
  }

  /**
   * トリガー起動時の処理
   */
  public activateTarget(targetId: string, source?: any): void {
    const target = this.targets.get(targetId);
    if (target) {
      target.activate();
    } else {
      console.warn(`GimmickTarget with ID '${targetId}' not found.`);
    }
  }

  /**
   * トリガー解除時の処理（ボタン用）
   */
  public deactivateTarget(targetId: string, source?: any): void {
    const target = this.targets.get(targetId);
    if (target) {
      target.deactivate();
    }
  }

  /**
   * ターゲットの状態を反転させる（レバースイッチ用）
   */
  public toggleTarget(targetId: string, source?: any): void {
    const target = this.targets.get(targetId);
    if (target) {
      target.toggle();
    }
  }

  /**
   * 管理情報のクリア
   */
  public clear(): void {
    this.targets.clear();
  }

  public handleDoorCollision(player: Player, door: Door) {
    if (door.isActive()) return;

    const doorId = door.id;
    // 該当する扉の鍵を持っているか確認
    if (player.hasKeyFor(doorId)) {
      // 扉を開ける
      this.activateTarget(doorId, player);
      // 使った鍵を削除
      player.useKeyFor(doorId);
    } else {
    }
  }
}
