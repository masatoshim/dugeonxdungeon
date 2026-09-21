import * as Phaser from "phaser";
import { ASSETS } from "@/game-core/master";
import { GAME_EVENTS, MapData, TILE_SIZE, LevelGroups } from "@/game-core/types";
import { LevelBuilder } from "@/game-core/scenes/main/builders/LevelBuilder";
import {
  Player,
  Enemy,
  DirectionalDoor,
  Door,
  LimitedDoor,
  EnemyBullet,
  Button,
  LeverSwitch,
} from "@/game-core/entities";
import { EnemyManager, WarpManager, StoneManager, CombatManager, DoorManager } from "@/game-core/scenes/main/managers";
import { TimerUI } from "@/game-core/scenes/main/ui/TimerUI";

export class MainScene extends Phaser.Scene {
  private startTime: number = 0;
  private timeLimit: number = 0;
  private timeLeft: number = 0;
  private isTimerStarted: boolean = false;
  private isGameOver: boolean = false;

  private player!: Player;
  private levelBuilder!: LevelBuilder;
  private mapData!: MapData;

  // UI専用カメラ
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;

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
  private enemyManager!: EnemyManager;
  private warpManager!: WarpManager;
  private stoneManager!: StoneManager;
  private combatManager!: CombatManager;
  private doorManager!: DoorManager;

  constructor() {
    super("MainScene");
  }

  init(data: { mapData: MapData; timeLimit: number }) {
    this.mapData = data.mapData;
    this.timeLimit = data.timeLimit;
    this.timeLeft = data.timeLimit ?? 60;
    this.isGameOver = false;
    this.isTimerStarted = false;

    // マネージャーの初期化
    this.enemyManager = new EnemyManager(this);
    this.doorManager = new DoorManager(this);
    this.warpManager = new WarpManager(this);
    this.stoneManager = new StoneManager(this);
    this.combatManager = new CombatManager(this, this.stoneManager);
    this.levelBuilder = new LevelBuilder(this, this.enemyManager, this.doorManager, this.warpManager);
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
    this.enemyBullets = this.physics.add.group({
      runChildUpdate: true,
    });

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
    this.levelBuilder.createLevel(this.mapData, levelGroups);
    // 各衝突判定を設定
    this.setupPhysics();
    // カメラ設定
    this.setupCamera();

    // タイマーUIの生成
    this.timerUI = new TimerUI(this, this.timeLimit);

    // メインカメラからはタイマーUIのコンテナを除外する
    this.cameras.main.ignore(this.timerUI.getContainer());

    // UIカメラには、タイマーUI以外をすべて除外させる
    const uiContainer = this.timerUI.getContainer();
    const worldObjects = this.children.list.filter((obj) => obj !== uiContainer);
    this.uiCamera.ignore(worldObjects);

    // React側からの中断要求を受け取るリスナーを登録
    this.game.events.on(GAME_EVENTS.REQUEST_INTERRUPT, () => {
      // すでにゲームオーバーやクリアになっていなければ処理
      if (this.isGameOver) return;
      this.isGameOver = true;

      // 現在のスコアと残り時間を取得
      const currentScore = this.player.getScore() ?? 0;
      const currentTimeLeft = this.timeLeft;

      // React側へイベントでデータを送り返す
      this.game.events.emit(GAME_EVENTS.GAME_INTERRUPT, {
        score: currentScore,
        timeLeft: currentTimeLeft,
      });
    });
  }

  private setupPhysics() {
    if (!this.player) return;

    // プレイヤーと静的オブジェクトとの衝突
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.breakableWalls);
    this.physics.add.collider(this.player, this.footstompTraps);
    // プレイヤーとアイテムの接触を監視
    this.physics.add.overlap(
      this.player,
      this.items,
      (_player, itemObj) => this.player.handleItemPickup(itemObj),
      undefined,
      this,
    );
    // プレイヤーと扉の衝突設定
    this.physics.add.collider(
      this.player,
      this.doors,
      // 衝突が発生した時のコールバック
      (player, doorObj) => {
        this.doorManager.handleDoorCollision(player as Player, doorObj as Door);
      },
      // 衝突判定を行うかどうかを決めるチェック
      (_player, doorObj) => {
        // カウントダウン扉の判定
        if (doorObj instanceof LimitedDoor) {
          return doorObj.getRemainingCount() === 0;
        }
        // 一方通行扉の判定
        if (doorObj instanceof DirectionalDoor) {
          return !doorObj.isOpened;
        }
        // その他の扉はデフォルトで衝突有効
        return true;
      },
      this,
    );

    // プレイヤーとボタンの衝突設定
    this.physics.add.overlap(
      this.player,
      this.buttonsGroup,
      (_player, buttonObj) => {
        (buttonObj as Button).onOverlap();
      },
      undefined,
      this,
    );

    // プレイヤーとレバースイッチの衝突設定
    this.physics.add.overlap(
      this.player,
      this.leversGroup,
      (_player, leverObj) => {
        (leverObj as LeverSwitch).onOverlap();
      },
      undefined,
      this,
    );

    // プレイヤーとワープマスの重ね合わせ判定
    this.physics.add.overlap(this.player, this.warps, (_player, warpObj) => {
      this.warpManager.handleWarpOverlap(this.player, warpObj as Phaser.Physics.Arcade.Sprite);
    });

    // プレイヤーと石との衝突処理
    this.physics.add.collider(this.player, this.movableStones, (player, stoneObj) => {
      const stone = stoneObj as Phaser.Physics.Arcade.Sprite;
      const stoneType = stone.getData("stoneType");

      // とげとげの石は触れたら即ゲームオーバー
      if (stoneType === "SPIKE") {
        this.triggerGameOver(GAME_EVENTS.GAME_OVER);
        return;
      }
      // 重い石は押して移動させない
      if (stoneType === "HEAVY") return;

      this.stoneManager.handleStonePush(
        player as Player,
        stone,
        this.enemies,
        this.walls,
        this.breakableWalls,
        this.doors,
        this.movableStones,
      );
    });

    // プレイヤーと弾のオーバーラップ
    this.physics.add.overlap(this.player, this.enemyBullets, () => this.triggerGameOver(GAME_EVENTS.GAME_OVER));

    // 通常の敵の場合、触れたら即ゲームオーバー
    this.physics.add.collider(
      this.player,
      this.enemies,
      (_player, _enemyObj) => {},
      (_player, enemyObj) => {
        const enemy = enemyObj as Enemy;
        // 障害物タイプの敵だけ物理的な衝突を有効にする
        return !!enemy.getEnemyData().isObstacle;
      },
    );

    this.physics.add.overlap(this.player, this.enemies, (_player, enemyObj) => {
      const enemy = enemyObj as Enemy;
      // 障害物タイプならダメージを与えない
      if (enemy.getEnemyData().isObstacle || false) {
        return;
      }
      this.triggerGameOver(GAME_EVENTS.GAME_OVER);
    });

    // 石が勝手に吹っ飛ぶのを防ぐ
    this.physics.add.collider(this.movableStones, this.walls);
    this.physics.add.collider(this.movableStones, this.movableStones);

    // 石とボタンの接触判定
    this.physics.add.overlap(
      this.movableStones,
      this.buttonsGroup,
      (_stoneObj, buttonObj) => {
        (buttonObj as Button).onOverlap();
      },
      undefined,
      this,
    );

    // 石とレバースイッチの接触判定
    this.physics.add.overlap(
      this.movableStones,
      this.leversGroup,
      (_stoneObj, leverObj) => {
        (leverObj as LeverSwitch).onOverlap();
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

    // 弾と障害物の衝突処理
    const wallsToCheck = [this.walls, this.breakableWalls, this.doors, this.movableStones];
    wallsToCheck.forEach((obstacleGroup) => {
      if (obstacleGroup) {
        this.physics.add.collider(this.enemyBullets, obstacleGroup, (bullet) => {
          bullet.destroy();
        });
      }
    });
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
      this.triggerGameOver(GAME_EVENTS.TIME_OVER);
    }

    if (this.player) {
      this.player.update();
      this.checkGoalCondition();
    }

    this.enemyManager.update();

    if (this.warpManager && this.player) {
      this.warpManager.update(this.player, this.enemies);
    }

    // 一方通行扉の毎フレーム通過・距離チェック
    if (this.player && this.doors) {
      this.doors.getChildren().forEach((door) => {
        // 一方通行扉の処理
        if (door instanceof DirectionalDoor) {
          door.updatePassCheck(this.player);
        }
        // カウントダウン扉の処理を追加
        if (door instanceof LimitedDoor) {
          door.checkLimitedDoorPass(this.player);
        }
      });
    }
  }

  /**
   * ゲームオーバー時の統合処理
   */
  private triggerGameOver(notificationType: string) {
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
  }

  private setupCamera() {
    const mapWidth = this.mapData.width * TILE_SIZE;
    const mapHeight = this.mapData.height * TILE_SIZE;

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // UIカメラの初期作成（メインカメラと同じサイズ・位置で重ねる）
    const viewWidth = this.cameras.main.width;
    const viewHeight = this.cameras.main.height;

    if (!this.uiCamera) {
      this.uiCamera = this.cameras.add(0, 0, viewWidth, viewHeight);
      this.uiCamera.setScroll(0, 0); // UIカメラはスクロールさせない
    }

    const applyCameraLayout = () => {
      const w = this.cameras.main.width;
      const h = this.cameras.main.height;
      if (w === 0 || h === 0) return;

      // UIカメラのサイズも画面リサイズに合わせて追従させる
      if (this.uiCamera) {
        this.uiCamera.setSize(w, h);
      }

      if (!this.player) return;

      const isLargerX = mapWidth > viewWidth;
      const isLargerY = mapHeight > viewHeight;

      if (isLargerX || isLargerY) {
        // ダンジョンがキャンバスより大きい場合：プレイヤーを中心に追従
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      } else {
        // ダンジョンがキャンバスより小さい場合：ダンジョン全体をキャンバスの中央に配置
        this.cameras.main.stopFollow();
        this.cameras.main.removeBounds();
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
      }
    };

    // 即座に一度適用
    applyCameraLayout();

    // 画面リサイズ時のイベント登録（既存のままでOK）
    if (!this.scale.listeners("resize").includes(applyCameraLayout)) {
      this.scale.on("resize", applyCameraLayout, this);
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
