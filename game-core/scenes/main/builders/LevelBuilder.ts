import { TILE_CONFIG, TileConfigKey } from "@/game-core/master";
import { TILE_CATEGORIES, TILE_SIZE, MapData, TileConfig, LevelGroups } from "@/game-core/types";
import { EnemyManager, WarpManager, DoorManager } from "@/game-core/scenes/main/managers";

export class LevelBuilder {
  constructor(
    private scene: Phaser.Scene,
    private enemyManager: EnemyManager,
    private doorManager: DoorManager,
    private warpManager: WarpManager,
  ) {}

  /**
   * マップデータを解析して、各種オブジェクトを生成・グループ化する
   * 基本的にタイル配列（mapData）に基づいた静的な配置を行う
   */
  public createLevel(mapData: MapData, groups: LevelGroups) {
    this.enemyManager.setupEnemiesGroup(groups.enemies);
    this.createFloorAndTiles(mapData.tiles, groups);
    if (mapData.entities) {
      // 各扉ギミックの生成と登録
      this.doorManager.createDoorGimmicks(this.scene, mapData.entities, groups);
      // ワープマスの生成と登録
      this.warpManager.setupWarps(mapData, groups.warps);
    }
  }

  /**
   * 床と基本タイルの生成
   * @param tiles
   * @param groups
   */
  public createFloorAndTiles(tiles: TileConfigKey[][], groups: LevelGroups) {
    // 地面を描画
    tiles.forEach((row, y) => {
      row.forEach((_, x) => {
        const posX = x * TILE_SIZE + TILE_SIZE / 2;
        const posY = y * TILE_SIZE + TILE_SIZE / 2;
        const floor = this.scene.add.image(posX, posY, "floor", 0);

        floor.setDepth(0);
      });
    });

    // 各オブジェクトを生成
    tiles.forEach((row, y) => {
      row.forEach((tileId, x) => {
        const config = TILE_CONFIG[tileId];

        // 設定がない、または空のタイルならスキップ
        if (!config || config.category === TILE_CATEGORIES.EMPTY) return;

        // タイルの中央座標を計算
        const posX = x * TILE_SIZE + TILE_SIZE / 2;
        const posY = y * TILE_SIZE + TILE_SIZE / 2;

        switch (config.category) {
          case TILE_CATEGORIES.PLAYER:
            // プレイヤーの初期位置をシーンに報告
            groups.onPlayerCreate(posX, posY);
            break;

          case TILE_CATEGORIES.WALL:
            this.createWall(posX, posY, config, groups);
            break;

          case TILE_CATEGORIES.STONE:
            this.createMovableStone(posX, posY, config, groups);
            break;

          case TILE_CATEGORIES.ITEM:
            this.createItemFromConfig(posX, posY, config, groups);
            break;

          case TILE_CATEGORIES.ENEMY:
            // Enemyクラスのインスタンスを生成してグループに追加
            if (config.enemyData) {
              this.enemyManager.createEnemy(posX, posY, config.texture!, 0, config.enemyData);
            }
            break;

          case TILE_CATEGORIES.GOAL:
            const goal = this.scene.physics.add.staticSprite(posX, posY, config.texture!, 0);
            groups.goal.add(goal);
            goal.body.updateFromGameObject();
            goal.setDepth(1);
            break;

          case TILE_CATEGORIES.GIMMICK:
            break;
        }
      });
    });
  }

  /**
   * アイテム生成用ヘルパー
   */
  private createItemFromConfig(x: number, y: number, config: TileConfig, groups: LevelGroups) {
    const item = this.scene.physics.add.staticSprite(x, y, config.texture, 0);
    item.setData("config", config);
    groups.items.add(item);
    (item.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
  }

  /**
   * 壁の生成ロジック
   */
  private createWall(x: number, y: number, config: TileConfig, groups: LevelGroups) {
    const targetGroup = config.isBreakable ? groups.breakableWalls : groups.walls;
    const wall = targetGroup.create(x, y, config.texture, 0) as Phaser.Physics.Arcade.Sprite;

    if (config.isBreakable) {
      wall.setData("hp", config.hp);
    }
    wall.setData("element", "WALL");
    wall.setData("color", config.color);
    wall.setData("isDisappearing", false); // 消滅中か判定用
    wall.setMass(9999);

    const body = wall.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();
  }

  /**
   * 動かせる石・氷の生成ロジック
   */
  private createMovableStone(x: number, y: number, config: TileConfig, groups: LevelGroups) {
    const stone = this.scene.physics.add.sprite(x, y, config.texture, 0);

    stone.setData("config", config);
    stone.setData("color", config.color || "NONE");
    stone.setData("isMoving", false);
    stone.setData("isDisappearing", false); // 消滅中か判定用

    stone.setData("stoneType", config.stoneData?.stoneType || "NORMAL");
    stone.setData("element", config.stoneData?.element || "STONE");
    stone.setData("allowedDirection", config.allowedDirection || "ALL");
    stone.setData("maxCount", config.maxCount);
    stone.setData("remainingCount", config.maxCount);

    if (config.hp !== undefined) stone.setData("hp", config.hp);

    groups.movableStones.add(stone);

    // Tween移動させるための物理無効化設定
    stone.setImmovable(true);
    stone.setPushable(false);
    stone.setFriction(0, 0);

    stone.body.setSize(TILE_SIZE, TILE_SIZE);
    stone.setDepth(2);
  }
}
