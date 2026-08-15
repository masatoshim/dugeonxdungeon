import * as Phaser from "phaser";
import { GAME_EVENTS, MapData, TileConfig, LevelGroups } from "@/game-core/types";
import { TileConfigKey } from "@/game-core/master";
import { TILE_SIZE } from "@/game-core/types";
import { ASSETS } from "@/game-core/master";
import { Player } from "@/game-core/entities/Player";
import { Enemy } from "@/game-core/entities/Enemy";
import { LevelBuilder } from "@/game-core/builders/LevelBuilder";
import { TimerUI } from "@/game-core/scenes/main/ui/TimerUI";
import { WarpManager } from "@/game-core/scenes/main/managers/WarpManager";
import { StoneManager } from "@/game-core/scenes/main/managers/StoneManager";
import { CombatManager } from "@/game-core/scenes/main/managers/CombatManager";
import { DoorManager } from "@/game-core/scenes/main/managers/DoorManager";
import { DirectionalDoor } from "@/game-core/entities/DirectionalDoor";
import { MessageManager } from "@/game-core/scenes/main/managers/MessageManager";
import { EnemyBullet } from "@/game-core/entities/EnemyBullet";
import { Button } from "@/game-core/entities/Button";
import { LeverSwitch } from "@/game-core/entities/LeverSwitch";
import { Door } from "@/game-core/entities/Door";

export class MainScene extends Phaser.Scene {
  private startTime: number = 0;
  private timeLimit: number = 0;
  private timeLeft: number = 0;
  private isTimerStarted: boolean = false;
  private isGameOver: boolean = false;

  private tiles!: TileConfigKey[][];

  private player!: Player;
  private levelBuilder!: LevelBuilder;
  private mapData!: MapData;

  // 物理グループ
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private doors!: Phaser.Physics.Arcade.StaticGroup;
  private breakableWalls!: Phaser.Physics.Arcade.StaticGroup;
  private items!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private movableStones!: Phaser.Physics.Arcade.Group;
  private goalGroup!: Phaser.Physics.Arcade.StaticGroup;
  private warps!: Phaser.Physics.Arcade.StaticGroup;
  private footstompTraps!: Phaser.Physics.Arcade.StaticGroup;
  private buttonsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private leversGroup!: Phaser.Physics.Arcade.StaticGroup;

  // ヘルパー・マネージャー
  private timerUI!: TimerUI;
  private warpManager!: WarpManager;
  private stoneManager!: StoneManager;
  private combatManager!: CombatManager;
  private doorManager!: DoorManager;

  constructor() {
    super("MainScene");
  }

  init(data: { mapData: MapData; timeLimit: number }) {
    this.mapData = data.mapData;
    this.tiles = data.mapData.tiles;
    this.timeLimit = data.timeLimit;
    this.timeLeft = data.timeLimit ?? 60;
    this.levelBuilder = new LevelBuilder(this);
    this.isGameOver = false;
    this.isTimerStarted = false;

    // マネージャーの初期化
    this.doorManager = new DoorManager(this);
    this.stoneManager = new StoneManager(this);
    this.combatManager = new CombatManager(this, this.stoneManager);
  }

  preload() {
    // すべてのアセットを一律で TILE_SIZExTILE_SIZE のスプライトシートとして全自動ロード
    Object.entries(ASSETS).forEach(([key, path]) => {
      this.load.spritesheet(key, path, { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE });
    });
  }

  create() {
    this.physics.world.setFPS(60);
    this.physics.world.OVERLAP_BIAS = 4;
    this.physics.world.TILE_BIAS = TILE_SIZE;

    // 各グループの作成
    this.walls = this.physics.add.staticGroup();
    this.breakableWalls = this.physics.add.staticGroup();
    this.items = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.goalGroup = this.physics.add.staticGroup();
    this.movableStones = this.physics.add.group();
    this.doors = this.physics.add.staticGroup();
    this.warps = this.physics.add.staticGroup();
    this.footstompTraps = this.physics.add.staticGroup();
    this.buttonsGroup = this.physics.add.staticGroup();
    this.leversGroup = this.physics.add.staticGroup();

    this.warpManager = new WarpManager(this, this.warps);

    const levelGroups: LevelGroups = {
      walls: this.walls,
      doors: this.doors,
      breakableWalls: this.breakableWalls,
      items: this.items,
      enemies: this.enemies,
      goal: this.goalGroup,
      movableStones: this.movableStones,
      warps: this.warps,
      buttonsGroup: this.buttonsGroup,
      leversGroup: this.leversGroup,
      onPlayerCreate: (x, y) => {
        this.player = new Player(this, x, y);
        this.player.setDepth(10);
        this.player.setOnAttack((ax, ay, dir, w) =>
          this.combatManager.handleAttack(
            this.player,
            ax,
            ay,
            dir,
            w,
            this.movableStones,
            this.enemies,
            this.walls,
            this.breakableWalls,
            this.doors,
            this.enemyBullets,
            this.footstompTraps,
            this.leversGroup,
          ),
        );
      },
    };

    // LevelManagerを使用してマップ配置
    this.levelBuilder.createLevel(this.tiles, levelGroups);
    // ワープマスの生成と登録
    this.warpManager.setupWarps(this.mapData);
    // 各扉ギミックの生成と登録
    this.doorManager.createGimmicks(this, this.mapData.entities, levelGroups);

    // 敵の弾グループを作成
    this.enemyBullets = this.physics.add.group({
      runChildUpdate: true,
    });
    // 弾とプレイヤーのオーバーラップ
    this.physics.add.overlap(this.player, this.enemyBullets, () =>
      this.triggerGameOver("GAME OVER", GAME_EVENTS.GAME_OVER),
    );
    // 弾と障害物の衝突処理
    const wallsToCheck = [this.walls, this.breakableWalls, this.doors, this.movableStones];
    wallsToCheck.forEach((obstacleGroup) => {
      if (obstacleGroup) {
        this.physics.add.collider(this.enemyBullets, obstacleGroup, (bullet) => {
          bullet.destroy();
        });
      }
    });

    this.setupItemCollisions(); // アイテム判定
    this.setupPhysics(); // 壁や敵との衝突判定
    this.setupCamera(); // カメラ設定

    this.timerUI = new TimerUI(this, this.timeLimit);
  }

  private setupPhysics() {
    if (!this.player) return;

    // プレイヤーと静的オブジェクトとの衝突
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.breakableWalls);
    this.physics.add.collider(this.player, this.footstompTraps);
    this.physics.add.collider(
      this.player,
      this.doors,
      (player, door) => {
        if (!(door instanceof DirectionalDoor)) {
          this.doorManager.handleDoorCollision(player as Player, door as Door);
        }
      },
      (_player, door) => {
        if (door instanceof DirectionalDoor && door.isOpened) {
          return false;
        }
        return true;
      },
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.buttonsGroup,
      (player, button) => {
        (button as Button).onOverlap();
      },
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.leversGroup,
      (player, lever) => {
        (lever as LeverSwitch).onOverlap();
      },
      undefined,
      this,
    );

    // 石とボタンの接触判定
    this.physics.add.overlap(
      this.movableStones,
      this.buttonsGroup,
      (stone, button) => {
        (button as Button).onOverlap();
      },
      undefined,
      this,
    );
    // 石とレバースイッチの接触判定
    this.physics.add.overlap(
      this.movableStones,
      this.leversGroup,
      (stone, lever) => {
        (lever as LeverSwitch).onOverlap();
      },
      undefined,
      this,
    );

    // 敵と壁の衝突
    this.physics.add.collider(
      this.enemies,
      this.walls,
      undefined,
      (enemyObj) => {
        const enemy = enemyObj as Enemy;
        return !enemy.getEnemyData().isGhost;
      },
      this,
    );

    // 敵と壊せる壁との衝突
    this.physics.add.collider(
      this.enemies,
      this.breakableWalls,
      undefined,
      (enemyObj) => {
        const enemy = enemyObj as Enemy;
        return !enemy.getEnemyData().isGhost;
      },
      this,
    );

    // 敵と扉との衝突
    this.physics.add.collider(
      this.enemies,
      this.doors,
      undefined,
      (enemyObj) => {
        const enemy = enemyObj as Enemy;
        return !enemy.getEnemyData().isGhost;
      },
      this,
    );

    // 敵と石の衝突設定
    this.physics.add.collider(this.enemies, this.movableStones, (enemyObj, stoneObj) => {
      const enemy = enemyObj as Enemy;
      const stone = stoneObj as Phaser.Physics.Arcade.Sprite;
      const stoneType = stone.getData("stoneType");

      // MIRRORタイプの敵のみ石を押せるように判定
      if (enemy.getEnemyData().moveType === "MIRROR") {
        if (stoneType === "HEAVY" || stoneType === "SPIKE") return;
        this.stoneManager.handleStonePush(
          enemy,
          stone,
          this.enemies,
          this.walls,
          this.breakableWalls,
          this.doors,
          this.movableStones,
        );
        return;
      }
      // 石が移動中の場合のみ、衝突時に停止処理を行う
      if (stone.getData("isMoving")) {
        // 進行方向に敵がいるかチェックして止める
        this.stoneManager.checkAndStopStoneOnEnemyCollision(enemyObj as Phaser.Physics.Arcade.Sprite, stone);
      }
    });

    // プレイヤーと石との衝突処理：物理的な押し出しではなく、handleStonePush を実行する
    this.physics.add.collider(this.player, this.movableStones, (p, stoneObject) => {
      const stone = stoneObject as Phaser.Physics.Arcade.Sprite;
      const stoneType = stone.getData("stoneType");

      // とげとげの石は触れたら即ゲームオーバー
      if (stoneType === "SPIKE") {
        this.triggerGameOver("GAME OVER", GAME_EVENTS.GAME_OVER);
        return;
      }
      // 重い石は押して移動させない
      if (stoneType === "HEAVY") return;

      this.stoneManager.handleStonePush(
        p as Player,
        stone,
        this.enemies,
        this.walls,
        this.breakableWalls,
        this.doors,
        this.movableStones,
      );
    });

    // 石が勝手に吹っ飛ぶのを防ぐ
    this.physics.add.collider(this.movableStones, this.walls);
    this.physics.add.collider(this.movableStones, this.movableStones);

    // プレイヤーと扉の衝突判定
    this.physics.add.collider(this.player, this.doors, (_, d) => {
      const door = d as Phaser.Physics.Arcade.Sprite;
      const doorId = door.getData("id");

      if (door.getData("isLocked") && this.player.hasKeyFor(doorId)) {
        this.player.useKeyFor(doorId);
        door.setData("isLocked", false);
        const openFrame = door.getData("openFrame") ?? 0;
        door.setFrame(openFrame);
        door.setAlpha(0.3);
        if (door.body) (door.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      }
    });

    // プレイヤーとワープマスの重ね合わせ判定
    this.physics.add.overlap(
      this.player,
      this.warps, // LevelBuilder が生成してグループに格納したワープ群
      (_, warp) => {
        // ワープ処理の発火
        this.warpManager.handleWarpOverlap(this.player, warp as Phaser.Physics.Arcade.Sprite);
      },
    );

    // 敵とワープマスの重ね合わせ判定
    this.physics.add.overlap(
      this.enemies,
      this.warps,
      // 実際に接触した時の処理
      (enemyObj, warpObj) => {
        const enemy = enemyObj as Enemy;
        this.warpManager.handleWarpOverlap(enemy, warpObj as Phaser.Physics.Arcade.Sprite);
      },
      // 物理的な接触判定を行うかどうかの判定
      (enemyObj, _warpObj) => {
        const enemy = enemyObj as Enemy;
        // MIRRORタイプ以外の敵はすり抜け
        if (enemy.getEnemyData().moveType !== "MIRROR") return false;

        // すでにワープ中または移動先マス上に留まっている場合は判定スキップ
        if (enemy.getData("isWarping") || enemy.getData("isOverlappingWarp")) return false;

        return true;
      },
      this,
    );

    this.physics.add.collider(
      this.player,
      this.enemies,
      (player, enemies) => {
        // 通常の敵（障害物タイプでない）の場合、触れたら即ゲームオーバー
      },
      (player, enemies) => {
        const enemy = enemies as Enemy;
        // 障害物タイプの敵だけ物理的な衝突を有効にする
        return !!enemy.getEnemyData().isObstacle;
      },
    );

    this.physics.add.overlap(this.player, this.enemies, (player, enemyObj) => {
      const enemy = enemyObj as Enemy;

      // 障害物タイプ（isObstacle: true）ならダメージを与えない
      if (enemy.getEnemyData().isObstacle || false) {
        return;
      }
      this.triggerGameOver("GAME OVER", GAME_EVENTS.GAME_OVER);
    });
  }

  private setupItemCollisions() {
    if (!this.player) return;
    // player と items グループの接触を監視
    this.physics.add.overlap(this.player, this.items, this.handleItemPickup, undefined, this);
  }

  // アイテムを拾った時の処理
  private handleItemPickup(_playerObj: any, itemObj: any) {
    const itemSprite = itemObj as Phaser.Physics.Arcade.Sprite;
    const config: TileConfig = itemSprite.getData("config");
    if (!config) return;

    // 鍵のパターン
    if (config.item?.type === "KEY" && config.item.targetDoorId) {
      this.player.addKey(config.item.targetDoorId);
      itemSprite.destroy();
      MessageManager.getInstance().notify(`${config.item.name}を拾った！`);
      return;
    }

    // スコアアイテムのパターン
    if (config.item?.type === "SCORE_ITEM") {
      this.player.addScore(config.item.score || 0);
      itemSprite.destroy();
      MessageManager.getInstance().notify(`${config.name}を手に入れた！`);
      return;
    }

    // 武器のパターン
    if (config.weaponData) {
      this.player.equipWeapon(config.weaponData);
      itemSprite.destroy();
      MessageManager.getInstance().notify(`${config.name}を装備した！`);
      return;
    }
  }

  public getPlayer(): Player {
    return this.player;
  }

  public getWalls(): Phaser.Physics.Arcade.StaticGroup {
    return this.walls;
  }

  public getBreakableWalls(): Phaser.Physics.Arcade.StaticGroup {
    return this.breakableWalls;
  }

  public getDoors(): Phaser.Physics.Arcade.StaticGroup {
    return this.doors;
  }

  public getMovableStones(): Phaser.Physics.Arcade.Group {
    return this.movableStones;
  }

  public getFootstompTraps(): Phaser.Physics.Arcade.StaticGroup {
    return this.footstompTraps;
  }

  // Enemyから弾を受け取ってグループに追加するメソッド
  public registerEnemyBullet(bullet: EnemyBullet) {
    this.enemyBullets.add(bullet);
  }

  update() {
    // ゲーム終了時は何もしない
    if (this.isGameOver) return;

    if (!this.isTimerStarted) {
      this.startTime = performance.now();
      this.isTimerStarted = true;
    }

    // プレイ時間を小数点3桁で計測
    const now = performance.now();
    const elapsedMs = now - this.startTime;
    const currentLeft = Math.max(0, this.timeLimit - elapsedMs / 1000);

    if (this.timeLeft !== currentLeft) {
      this.timeLeft = currentLeft;
      this.timerUI.update(this.timeLeft);
    }

    if (this.timeLeft <= 0) {
      this.triggerGameOver("TIME UP!", GAME_EVENTS.TIME_OVER);
    }

    if (this.player) {
      this.player.update();
      this.checkGoalCondition();
    }

    this.enemies.getChildren().forEach((enemy) => enemy.update());

    if (this.warpManager && this.player) {
      this.warpManager.update(this.player, this.enemies);
    }

    // 一方通行扉の毎フレーム通過・距離チェック
    if (this.player && this.doors) {
      this.doors.getChildren().forEach((door) => {
        if (door instanceof DirectionalDoor) {
          door.updatePassCheck(this.player);
        }
      });
    }
  }

  /**
   * ゲームオーバー時の統合処理
   */
  private triggerGameOver(message: string, notificationType: string) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // 物理演算を停止
    this.physics.pause();

    // プレイヤーの操作と入力を完全に遮断
    this.player.active = false;
    this.player.setTint(0x555555);
    this.input.keyboard?.shutdown();
    this.input.keyboard?.removeAllListeners();

    this.cameras.main.shake(500, 0.01);

    this.game.events.emit(notificationType, { score: 0, timeLeft: this.timeLeft });

    // ゲーム画面上のテキスト表示
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, message, {
        fontSize: "64px",
        color: "#ff0000",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);
  }

  private setupCamera() {
    const mapWidth = this.tiles[0].length * TILE_SIZE;
    const mapHeight = this.tiles.length * TILE_SIZE;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    if (mapWidth > this.scale.width || mapHeight > this.scale.height) {
      // プレイヤーの追従（マップが画面より大きい場合のみ有効に機能する）
      this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    } else {
      // マップを画面の中央に
      this.cameras.main.setScroll(-(this.scale.width - mapWidth) / 2, -(this.scale.height - mapHeight) / 2);
    }
  }

  private handleGoal() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.physics.pause();
    this.player.setTint(0x00ff00);
    // カメラを少しズーム
    this.cameras.main.zoomTo(1.2, 1000, "Power2");
    this.game.events.emit(GAME_EVENTS.GAME_CLEAR, { score: this.player.getScore(), timeLeft: this.timeLeft });
  }

  private checkGoalCondition() {
    const goals = this.goalGroup.getChildren() as Phaser.GameObjects.Sprite[];
    for (const goal of goals) {
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      const goalBody = goal.body as Phaser.Physics.Arcade.StaticBody;
      const isContained =
        playerBody.left >= goalBody.left &&
        playerBody.right <= goalBody.right &&
        playerBody.top >= goalBody.top &&
        playerBody.bottom <= goalBody.bottom;
      if (isContained) {
        this.handleGoal();
        return;
      }
    }
  }
}
