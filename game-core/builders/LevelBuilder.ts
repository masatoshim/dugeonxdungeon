import { TILE_CONFIG, TILE_CATEGORIES, TileConfig, EntityData, GimmickConnection } from "@/types";
import { Enemy } from "@/game-core/entities/Enemy";

export interface LevelGroups {
  walls: Phaser.Physics.Arcade.StaticGroup;
  doors: Phaser.Physics.Arcade.StaticGroup;
  breakableWalls: Phaser.Physics.Arcade.StaticGroup;
  items: Phaser.Physics.Arcade.StaticGroup;
  enemies: Phaser.Physics.Arcade.Group;
  goal: Phaser.Physics.Arcade.StaticGroup;
  movableStones: Phaser.Physics.Arcade.Group;
  onPlayerCreate: (x: number, y: number) => void;
}

export class LevelBuilder {
  private tileSize: number = 32;
  private doorMap = new Map<string, Phaser.GameObjects.Sprite | Phaser.GameObjects.Image>();

  constructor(private scene: Phaser.Scene) {}

  /**
   * マップデータを解析して、各種オブジェクトを生成・グループ化する
   * 基本的にタイル配列（mapData）に基づいた静的な配置を行う
   */
  public createLevel(mapData: string[][], groups: LevelGroups) {
    mapData.forEach((row, y) => {
      row.forEach((tileId, x) => {
        const config = TILE_CONFIG[tileId];

        // 設定がない、または空のタイルならスキップ
        if (!config || config.category === TILE_CATEGORIES.EMPTY) return;

        // タイルの中央座標を計算
        const posX = x * this.tileSize + this.tileSize / 2;
        const posY = y * this.tileSize + this.tileSize / 2;

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

          case TILE_CATEGORIES.ICE:
            this.createMovableStone(posX, posY, config, groups);
            break;

          case TILE_CATEGORIES.GIMMICK:
            // 扉系のタイルID（KD1など）であれば生成
            // 鍵は Entity 側で生成するため、ここでは ID で判定
            if (tileId.startsWith("KD")) {
              this.createDoorFromConfig(posX, posY, config, groups);
            }
            break;

          case TILE_CATEGORIES.ITEM:
            this.createItemFromConfig(posX, posY, config, groups);
            break;

          case TILE_CATEGORIES.ENEMY:
            // Enemyクラスのインスタンスを生成してグループに追加
            const enemy = new Enemy(
              this.scene,
              posX,
              posY,
              config.texture!,
              config.frame || 0,
              config.enemyData?.hp || config.hp || 1,
            );
            if (config.enemyData) enemy.setData("enemyData", config.enemyData);

            groups.enemies.add(enemy);
            break;

          case TILE_CATEGORIES.GOAL:
            const goal = this.scene.physics.add.staticSprite(posX, posY, config.texture!, config.frame || 0);
            groups.goal.add(goal);
            goal.body.updateFromGameObject();
            goal.setDepth(1);
            break;
        }
      });
    });
  }

  /**
   * エディタで配置された EntityData（鍵、扉、ボタン）を生成し、接続関係を構築する
   */
  public createGimmicks(scene: Phaser.Scene, entities: EntityData[] = [], groups: LevelGroups): GimmickConnection[] {
    if (!entities || !Array.isArray(entities)) return [];

    const connections: GimmickConnection[] = [];
    this.doorMap.clear();

    // 扉の生成
    entities
      .filter((e) => e.type === "DOOR")
      .forEach((e) => {
        const tileId = e.properties?.tileId || "KD1";
        const config = TILE_CONFIG[tileId];
        const door = scene.physics.add.staticSprite(e.x * 32 + 16, e.y * 32 + 16, config.texture);

        door.setFrame(config.frame);
        door.setData("id", e.id);
        door.setData("isLocked", config.isLocked);
        door.setData("openFrame", config.openFrame);
        door.setData("closedFrame", config.frame);

        groups.doors.add(door);
        this.doorMap.set(e.id, door);
      });

    // ボタンの生成
    entities
      .filter((e) => e.type === "BUTTON")
      .forEach((e) => {
        const tileId = e.properties?.tileId || "B1";
        const config = TILE_CONFIG[tileId];

        const button = scene.physics.add.sprite(e.x * 32 + 16, e.y * 32 + 16, config.texture);
        button.setFrame(config.frame);
        button.setImmovable(true);

        button.setData("openFrame", config.openFrame);
        button.setData("closedFrame", config.frame);

        if (button.body instanceof Phaser.Physics.Arcade.Body) {
          button.body.setSize(18, 18);
        }

        const targetId = e.properties?.targetId;
        const targetDoor = targetId ? this.doorMap.get(targetId) : null;

        if (targetDoor) {
          connections.push({ button, door: targetDoor as Phaser.Physics.Arcade.Sprite });
        }

        button.setDepth(1);
      });

    // カギの生成
    entities
      .filter((e) => e.type === "KEY")
      .forEach((e) => {
        const tileId = e.properties?.tileId || "K1";
        const config = TILE_CONFIG[tileId];

        // config からテクスチャとフレームを取得
        const keyItem = scene.physics.add.staticSprite(
          e.x * 32 + 16,
          e.y * 32 + 16,
          config.texture || "items",
          config.frame ?? 1,
        );

        // 拾った際のアイテム情報と、エディタで設定した targetId をマージ
        keyItem.setData("config", {
          ...config,
          item: {
            ...config.item,
            id: e.id,
            targetDoorId: e.properties?.targetId, // 扉との紐付け
          },
        });

        groups.items.add(keyItem);
        (keyItem.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      });

    return connections;
  }

  /**
   * 扉生成用ヘルパー
   */
  private createDoorFromConfig(x: number, y: number, config: TileConfig, groups: LevelGroups) {
    const door = this.scene.physics.add.staticSprite(x, y, config.texture, config.frame);
    if (config.openFrame !== undefined) door.setData("openFrame", config.openFrame);
    if (config.isLocked) door.setData("isLocked", true);
    groups.doors.add(door);
  }

  /**
   * アイテム生成用ヘルパー
   */
  private createItemFromConfig(x: number, y: number, config: TileConfig, groups: LevelGroups) {
    const item = this.scene.physics.add.staticSprite(x, y, config.texture, config.frame);
    item.setData("config", config);
    groups.items.add(item);
    (item.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
  }

  /**
   * 壁の生成ロジック
   */
  private createWall(x: number, y: number, config: TileConfig, groups: LevelGroups) {
    const targetGroup = config.isBreakable ? groups.breakableWalls : groups.walls;
    const wall = targetGroup.create(x, y, config.texture, config.frame) as Phaser.Physics.Arcade.Sprite;

    if (config.isBreakable) {
      wall.setData("hp", config.hp);
    }
    wall.setMass(9999);

    const body = wall.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();
  }

  /**
   * 動かせる石・氷の生成ロジック
   */
  private createMovableStone(x: number, y: number, config: TileConfig, groups: LevelGroups) {
    const stone = this.scene.physics.add.sprite(x, y, config.texture, config.frame);

    // config全体を保存しておくことで、MainScene側で config.category === TILE_CATEGORIES.ICE が判定可能になる
    stone.setData("config", config);
    stone.setData("isMoving", false);

    groups.movableStones.add(stone);

    // Tween移動させるための物理無効化設定
    stone.setImmovable(true);
    stone.setPushable(false);

    stone.body.setSize(32, 32);
    stone.setDepth(10);
  }
}
