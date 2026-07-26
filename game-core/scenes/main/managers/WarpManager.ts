import * as Phaser from "phaser";
import { MapData, EntityData } from "@/game-core/types";
import { Player } from "@/game-core/entities/Player";
import { TILE_CONFIG, TileConfigKey } from "@/game-core/master";

export class WarpManager {
  private scene: Phaser.Scene;
  private warps: Phaser.Physics.Arcade.StaticGroup;
  private warpMap: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private isWarping: boolean = false;

  // ワープマスの上に「まだ留まっているか」を判定するフラグ
  private isOverlappingWarp: boolean = false;
  private tileSize: number = 32;

  constructor(scene: Phaser.Scene, warpsGroup: Phaser.Physics.Arcade.StaticGroup) {
    this.scene = scene;
    this.warps = warpsGroup;
  }

  /**
   * 毎フレームの更新処理
   */
  public update(player: Player) {
    if (!this.warps || !player) return;

    // 現在プレイヤーがどのワープマスとも重なっていないか物理判定チェック
    const isTouching = this.scene.physics.overlap(player, this.warps);

    // ワープマスから完全に外に出たら、次回ワープ可能フラグを解除
    if (!isTouching) {
      this.isOverlappingWarp = false;
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
  public handleWarpOverlap(player: Player, warp: Phaser.Physics.Arcade.Sprite) {
    // ワープ処理中、または前回のワープからまだマスを離れていない場合は処理しない
    if (this.isWarping || this.isOverlappingWarp) return;

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
    this.isWarping = true;
    this.isOverlappingWarp = true;

    this.scene.tweens.add({
      targets: player,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        // 移動先へ配置
        player.setPosition(targetWarp.x, targetWarp.y);

        this.scene.tweens.add({
          targets: player,
          alpha: 1,
          duration: 150,
          onComplete: () => {
            // アニメーション完了
            this.isWarping = false;
          },
        });
      },
    });
  }
}
