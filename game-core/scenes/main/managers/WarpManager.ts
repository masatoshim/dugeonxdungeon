import * as Phaser from "phaser";
import { MapData, EntityData } from "@/game-core/types";
import { Player } from "@/game-core/entities/Player";
import { TILE_CONFIG } from "@/game-core/master";

export class WarpManager {
  private scene: Phaser.Scene;
  private warps: Phaser.Physics.Arcade.StaticGroup;
  private warpMap: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private tileSize: number = 32;

  constructor(scene: Phaser.Scene, warpsGroup: Phaser.Physics.Arcade.StaticGroup) {
    this.scene = scene;
    this.warps = warpsGroup;
  }

  /**
   * 毎フレームの更新処理
   * プレイヤーおよび敵がワープマスから離れたかを個別チェックしてフラグ解除
   */
  public update(player: Player, enemies?: Phaser.Physics.Arcade.Group) {
    if (!this.warps) return;

    // プレイヤーの離脱チェック
    if (player && player.getData("isOverlappingWarp")) {
      const isTouching = this.scene.physics.overlap(player, this.warps);
      if (!isTouching) {
        player.setData("isOverlappingWarp", false);
      }
    }

    // 敵グループの離脱チェック
    if (enemies) {
      enemies.getChildren().forEach((enemyObj) => {
        const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
        if (enemy.active && enemy.getData("isOverlappingWarp")) {
          const isTouching = this.scene.physics.overlap(enemy, this.warps);
          if (!isTouching) {
            enemy.setData("isOverlappingWarp", false);
          }
        }
      });
    }
  }

  /**
   * ワープオブジェクトを生成
   */
  public setupWarps(mapData: MapData) {
    this.warpMap.clear();
    if (!mapData.entities) return;

    mapData.entities.forEach((entity: EntityData) => {
      const config = TILE_CONFIG[entity.tileId];
      if (!config?.linkConfig) return;

      const { linkGroup, entityType } = config.linkConfig;

      // ワープに関連するグループか判定
      if (linkGroup === "WARP" || linkGroup === "WARP_TWO_WAY") {
        const worldX = entity.x * this.tileSize + this.tileSize / 2;
        const worldY = entity.y * this.tileSize + this.tileSize / 2;

        const texture = config.texture || entity.tileId;
        const warpSprite = this.warps.create(worldX, worldY, texture) as Phaser.Physics.Arcade.Sprite;

        warpSprite.setDepth(1);
        (warpSprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

        // エンティティデータと entityType を保持
        warpSprite.setData("id", entity.id);
        warpSprite.setData("targetId", entity.properties?.targetId);
        warpSprite.setData("entityType", entityType);

        this.warpMap.set(entity.id, warpSprite);
      }
    });
  }

  /**
   * 重なり検知時の処理
   */
  public handleWarpOverlap(entity: Phaser.Physics.Arcade.Sprite, warp: Phaser.Physics.Arcade.Sprite) {
    // ワープ処理中、または前回のワープからまだマスを離れていない場合は処理しない
    if (entity.getData("isWarping") || entity.getData("isOverlappingWarp")) return;

    const entityType = warp.getData("entityType");
    // 一方向ワープの出口（WARP_OUT）に踏み込んだ場合は何もしない
    if (entityType === "WARP_OUT") {
      return;
    }

    const targetId = warp.getData("targetId");
    if (!targetId) return;

    const targetWarp = this.warpMap.get(targetId);
    if (!targetWarp) return;

    // ワープ開始
    entity.setData("isWarping", true);
    entity.setData("isOverlappingWarp", true);

    this.scene.tweens.add({
      targets: entity,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        // 移動先へ配置
        entity.setPosition(targetWarp.x, targetWarp.y);
        if (entity.body) {
          entity.body.reset(targetWarp.x, targetWarp.y);
        }

        this.scene.tweens.add({
          targets: entity,
          alpha: 1,
          duration: 150,
          onComplete: () => {
            // アニメーション完了
            entity.setData("isWarping", false);
          },
        });
      },
    });
  }
}
