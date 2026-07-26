import * as Phaser from "phaser";
import { MapData } from "@/game-core/types";
import { Player } from "@/game-core/entities/Player";

export class WarpManager {
  private scene: Phaser.Scene;
  private warps: Phaser.Physics.Arcade.StaticGroup;
  private warpMap: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private isWarping: boolean = false;
  private tileSize: number = 32;

  constructor(scene: Phaser.Scene, warpsGroup: Phaser.Physics.Arcade.StaticGroup) {
    this.scene = scene;
    this.warps = warpsGroup;
  }

  /**
   * ワープオブジェクトを生成
   */
  public setupWarps(mapData: MapData) {
    this.warpMap.clear();
    if (!mapData.entities) return;
    // ワープタイルの判定
    mapData.entities.forEach((entity: any) => {
      if (entity.id && (entity.tileId?.startsWith("WI") || entity.tileId?.startsWith("WO"))) {
        const worldX = entity.x * this.tileSize + this.tileSize / 2;
        const worldY = entity.y * this.tileSize + this.tileSize / 2;

        const warpSprite = this.warps.create(worldX, worldY, entity.tileId) as Phaser.Physics.Arcade.Sprite;
        warpSprite.setData("id", entity.id);
        warpSprite.setData("targetId", entity.properties?.targetId);
        // IDをキーにして取得できるように保持
        this.warpMap.set(entity.id, warpSprite);
      }
    });
  }

  public handleWarpOverlap(player: Player, warpObj: Phaser.Physics.Arcade.Sprite) {
    if (this.isWarping) return;

    const tileId = warpObj.texture.key;
    if (tileId.startsWith("WO")) return;

    const targetId = warpObj.getData("targetId");
    if (!targetId) return;

    const targetWarp = this.warpMap.get(targetId);
    if (!targetWarp) return;

    this.isWarping = true;

    this.scene.tweens.add({
      targets: player,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        player.setPosition(targetWarp.x, targetWarp.y);
        this.scene.tweens.add({
          targets: player,
          alpha: 1,
          duration: 150,
          onComplete: () => {
            this.scene.time.delayedCall(300, () => {
              this.isWarping = false;
            });
          },
        });
      },
    });
  }
}
