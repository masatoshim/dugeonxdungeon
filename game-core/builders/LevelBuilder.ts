import { TILE_CONFIG } from "@/game-core/master";
import { TILE_CATEGORIES, TileConfig, EntityData, GimmickConnection } from "@/game-core/types";
import { Enemy } from "@/game-core/entities/Enemy";
import { TileConfigKey } from "@/game-core/master";

export interface Position {
  x: number;
  y: number;
}

export interface WarpPoint {
  id: string;
  tileId: TileConfigKey;
  position: Position;
  targetPosition: Position | null; // ワープ先の座標
}

export interface LevelGroups {
  walls: Phaser.Physics.Arcade.StaticGroup;
  doors: Phaser.Physics.Arcade.StaticGroup;
  breakableWalls: Phaser.Physics.Arcade.StaticGroup;
  items: Phaser.Physics.Arcade.StaticGroup;
  enemies: Phaser.Physics.Arcade.Group;
  goal: Phaser.Physics.Arcade.StaticGroup;
  warps: Phaser.Physics.Arcade.StaticGroup;
  movableStones: Phaser.Physics.Arcade.Group;
  onPlayerCreate: (x: number, y: number) => void;
}

export class LevelBuilder {
  private tileSize: number = 32;
  private doorMap = new Map<string, Phaser.GameObjects.Sprite | Phaser.GameObjects.Image>();

  // ワープ管理用
  private warpPositions = new Map<string, Position>();

  constructor(private scene: Phaser.Scene) {}

  /**
   * マップデータを解析して、各種オブジェクトを生成・グループ化する
   * 基本的にタイル配列（mapData）に基づいた静的な配置を行う
   */
  public createLevel(mapData: TileConfigKey[][], groups: LevelGroups) {
    // 地面を描画
    mapData.forEach((row, y) => {
      row.forEach((_, x) => {
        const posX = x * this.tileSize + this.tileSize / 2;
        const posY = y * this.tileSize + this.tileSize / 2;
        const floor = this.scene.add.image(posX, posY, "floor", 0);

        floor.setDepth(0);
      });
    });

    // 各オブジェクトを生成
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

          case TILE_CATEGORIES.GIMMICK:
            break;

          case TILE_CATEGORIES.ITEM:
            this.createItemFromConfig(posX, posY, config, groups);
            break;

          case TILE_CATEGORIES.ENEMY:
            // Enemyクラスのインスタンスを生成してグループに追加
            if (config.enemyData) {
              const enemy = new Enemy(this.scene, posX, posY, config.texture!, 0, config.enemyData);
              if (config.enemyData) enemy.setData("enemyData", config.enemyData);
              groups.enemies.add(enemy);
            }
            break;

          case TILE_CATEGORIES.GOAL:
            const goal = this.scene.physics.add.staticSprite(posX, posY, config.texture!, 0);
            groups.goal.add(goal);
            goal.body.updateFromGameObject();
            goal.setDepth(1);
            break;
        }
      });
    });
  }

  /**
   * エディタで配置された EntityData（鍵、扉、ボタン、ワープ）を生成し、接続関係を構築する
   */
  public createGimmicks(scene: Phaser.Scene, entities: EntityData[] = [], groups: LevelGroups): GimmickConnection[] {
    if (!entities || !Array.isArray(entities)) return [];

    const connections: GimmickConnection[] = [];
    this.doorMap.clear();
    this.warpPositions.clear(); // ワープマップの初期化

    // 扉の生成
    entities
      .filter((e) => e.tileId === "D1" || e.tileId === "KD1")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];
        const door = scene.physics.add.staticSprite(e.x * 32 + 16, e.y * 32 + 16, config.texture);

        const closedFrame = 0;
        door.setFrame(closedFrame);
        door.setData("id", e.id);
        door.setData("isLocked", config.isLocked ?? false);
        door.setData("openFrame", config.openFrame ?? 1);
        door.setData("closedFrame", closedFrame);

        groups.doors.add(door);
        this.doorMap.set(e.id, door);
      });

    // ボタンの生成
    entities
      .filter((e) => e.tileId === "B1")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];

        const button = scene.physics.add.sprite(e.x * 32 + 16, e.y * 32 + 16, config.texture);
        const closedFrame = 0;
        button.setFrame(closedFrame);
        button.setImmovable(true);

        button.setData("openFrame", config.openFrame ?? 1);
        button.setData("closedFrame", closedFrame);

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
      .filter((e) => e.tileId === "K1")
      .forEach((e) => {
        const config = TILE_CONFIG[e.tileId];

        // config からテクスチャとフレームを取得
        const keyItem = scene.physics.add.staticSprite(e.x * 32 + 16, e.y * 32 + 16, config.texture!, 0);

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

    // ワープ処理
    const entityMap = new Map<string, EntityData>();
    entities.forEach((e) => entityMap.set(e.id, e));

    entities
      .filter((e) => {
        const config = TILE_CONFIG[e.tileId];
        return config?.linkConfig?.linkGroup === "WARP";
      })
      .forEach((e) => {
        const targetId = e.properties?.targetId;
        if (targetId) {
          const targetEntity = entityMap.get(targetId);
          if (targetEntity) {
            const sourceGridKey = `${e.x},${e.y}`;
            const destPixelPos: Position = {
              x: targetEntity.x * 32 + 16,
              y: targetEntity.y * 32 + 16,
            };
            this.warpPositions.set(sourceGridKey, destPixelPos);
          }
        }
      });

    return connections;
  }

  /**
   * グリッド座標にワープが存在すれば、転送先ピクセル座標を返す
   */
  public getWarpDestination(gridX: number, gridY: number): Position | null {
    const key = `${gridX},${gridY}`;
    return this.warpPositions.get(key) ?? null;
  }

  /**
   * ピクセル座標からグリッド変換してワープ先を取得する便利ヘルパー
   */
  public getWarpDestinationByPixel(pixelX: number, pixelY: number): Position | null {
    const gridX = Math.floor(pixelX / this.tileSize);
    const gridY = Math.floor(pixelY / this.tileSize);
    return this.getWarpDestination(gridX, gridY);
  }

  /**
   * 扉生成用ヘルパー
   */
  private createDoorFromConfig(x: number, y: number, config: TileConfig, groups: LevelGroups) {
    const door = this.scene.physics.add.staticSprite(x, y, config.texture, 0);
    if (config.openFrame !== undefined) door.setData("openFrame", config.openFrame);
    if (config.isLocked) door.setData("isLocked", true);
    groups.doors.add(door);
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
    stone.setData("isMoving", false);

    stone.setData("stoneType", config.stoneData?.stoneType || "NORMAL");
    stone.setData("element", config.stoneData?.element || "STONE");
    if (config.hp !== undefined) stone.setData("hp", config.hp);

    groups.movableStones.add(stone);

    // Tween移動させるための物理無効化設定
    stone.setImmovable(true);
    stone.setPushable(false);
    stone.setFriction(0, 0);

    stone.body.setSize(32, 32);
    stone.setDepth(2);
  }
}
