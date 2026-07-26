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

      if (
        config?.linkConfig?.linkGroup === "WARP" ||
        entity.tileId?.startsWith("WI") ||
        entity.tileId?.startsWith("WO")
      ) {
        const worldX = entity.x * this.tileSize + this.tileSize / 2;
        const worldY = entity.y * this.tileSize + this.tileSize / 2;

        // TILE_CONFIG に指定された texture を使用
        const texture = config?.texture || entity.tileId;
        const warpSprite = this.warps.create(worldX, worldY, texture) as Phaser.Physics.Arcade.Sprite;

        warpSprite.setDepth(1);
        (warpSprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

        warpSprite.setData("id", entity.id);
        warpSprite.setData("targetId", entity.properties?.targetId);

        const warpType = entity.tileId.startsWith("WO") ? "OUT" : "IN";
        warpSprite.setData("type", warpType);

        // ワープマップに登録
        this.warpMap.set(entity.id, warpSprite);
      }
    });
  }

  /**
   * 重なり検知時の処理
   */
  public handleWarpOverlap(player: Player, warpObj: Phaser.Physics.Arcade.Sprite) {
    // ワープ処理中、または前回のワープからまだマスを離れていない場合は処理しない
    if (this.isWarping || this.isOverlappingWarp) return;

    // 出口からのワープ進入を拒否
    const warpType = warpObj.getData("type");
    if (warpType === "OUT") return;

    const targetId = warpObj.getData("targetId");
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
