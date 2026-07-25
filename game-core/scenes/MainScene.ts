import * as Phaser from "phaser";
import { GAME_EVENTS, MapData, WeaponData, GimmickConnection, TileConfig, EnemyData } from "@/game-core//types";
import { ASSETS } from "@/game-core/master";
import { Player } from "@/game-core/entities/Player";
import { Enemy } from "@/game-core/entities/Enemy";
import { LevelBuilder, LevelGroups } from "@/game-core/builders/LevelBuilder";
import { TileConfigKey } from "@/game-core/master";

export class MainScene extends Phaser.Scene {
  private startTime: number = 0;
  private timeLimit: number = 0;
  private timeLeft: number = 0;
  private isTimerStarted: boolean = false;

  private timeText!: Phaser.GameObjects.Text;
  private timeContainer!: Phaser.GameObjects.Graphics;

  // データ管理
  private tiles!: TileConfigKey[][];
  private tileSize: number = 32;

  // エンティティ・マネージャー
  private player!: Player;
  private levelBuilder!: LevelBuilder;
  private mapData!: MapData;

  // 物理グループ
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private doors!: Phaser.Physics.Arcade.StaticGroup;
  private breakableWalls!: Phaser.Physics.Arcade.StaticGroup;
  private items!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private movableStones!: Phaser.Physics.Arcade.Group;
  private goalGroup!: Phaser.Physics.Arcade.StaticGroup;

  private gimmickConnections: GimmickConnection[] = [];

  private isGameOver: boolean = false;

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
  }

  preload() {
    // すべてのアセットを一律で 32x32 のスプライトシートとして全自動ロード
    Object.entries(ASSETS).forEach(([key, path]) => {
      this.load.spritesheet(key, path, { frameWidth: 32, frameHeight: 32 });
    });
  }

  create() {
    this.physics.world.setFPS(60);
    this.physics.world.OVERLAP_BIAS = 4;
    this.physics.world.TILE_BIAS = 32;

    // 各グループの作成
    this.walls = this.physics.add.staticGroup();
    this.breakableWalls = this.physics.add.staticGroup();
    this.items = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.goalGroup = this.physics.add.staticGroup();
    this.movableStones = this.physics.add.group();
    this.doors = this.physics.add.staticGroup();

    const levelGroups: LevelGroups = {
      walls: this.walls,
      doors: this.doors,
      breakableWalls: this.breakableWalls,
      items: this.items,
      enemies: this.enemies,
      goal: this.goalGroup,
      movableStones: this.movableStones,
      onPlayerCreate: (x, y) => {
        this.player = new Player(this, x, y);
        this.player.setDepth(10);
        this.player.setOnAttack((ax, ay, dir, w) => this.handleAttack(ax, ay, dir, w));
      },
    };

    // LevelManagerを使用してマップ配置
    this.levelBuilder.createLevel(this.tiles, levelGroups);

    // 次に createGimmicks を実行（鍵や扉が生成される）
    this.gimmickConnections = this.levelBuilder.createGimmicks(this, this.mapData.entities, levelGroups);

    this.setupItemCollisions(); // アイテム判定
    this.setupPhysics(); // 壁や敵との衝突判定
    this.setupCamera(); // カメラ設定

    this.createTimerUI();
  }

  public getPlayer() {
    return this.player;
  }

  private setupPhysics() {
    if (!this.player) return;

    // 静的オブジェクトとの衝突
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.breakableWalls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.enemies, this.breakableWalls);
    // 敵と石の衝突設定
    this.physics.add.collider(this.enemies, this.movableStones, (enemyObj, stoneObj) => {
      const stone = stoneObj as Phaser.Physics.Arcade.Sprite;

      // 石が移動中の場合のみ、衝突時に停止処理を行う
      if (stone.getData("isMoving")) {
        // 進行方向に敵がいるかチェックして止める（※後述のメソッド）
        this.checkAndStopStoneOnEnemyCollision(enemyObj as Phaser.Physics.Arcade.Sprite, stone);
      }
    });
    this.physics.add.collider(this.enemies, this.doors);

    // 石との衝突処理：物理的な押し出しではなく、handleStonePush を実行する
    this.physics.add.collider(this.player, this.movableStones, (p, stoneObject) => {
      const stone = stoneObject as Phaser.Physics.Arcade.Sprite;
      const stoneType = stone.getData("stoneType");
      // 重い石は押して移動させない
      if (stoneType === "HEAVY") {
        return;
      }
      this.handleStonePush(p as Player, stoneObject as Phaser.Physics.Arcade.Sprite);
    });

    // 石が勝手に吹っ飛ぶのを防ぐ
    this.physics.add.collider(this.movableStones, this.walls);
    this.physics.add.collider(this.movableStones, this.movableStones);

    // 扉の衝突判定
    this.physics.add.collider(this.player, this.doors, (p, d) => {
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

    // 敵に接触したらゲームオーバー
    this.physics.add.overlap(
      this.player,
      this.enemies,
      () => this.triggerGameOver("GAME OVER", GAME_EVENTS.GAME_OVER),
      undefined,
      this,
    );
  }

  /**
   * 敵と石が進行方向で衝突した時の処理
   */
  private checkAndStopStoneOnEnemyCollision(enemy: Phaser.Physics.Arcade.Sprite, stone: Phaser.Physics.Arcade.Sprite) {
    const targetX = stone.getData("targetX");
    const targetY = stone.getData("targetY");
    if (targetX === undefined || targetY === undefined) return;

    // 石の進行方向
    const dirX = Math.sign(targetX - stone.x);
    const dirY = Math.sign(targetY - stone.y);

    // 衝突時の敵との位置関係
    const toEnemyX = enemy.x - stone.x;
    const toEnemyY = enemy.y - stone.y;

    // 進行方向と同じ向きに敵がいるかチェック
    const isFrontCollision =
      (dirX !== 0 && Math.sign(toEnemyX) === dirX) || (dirY !== 0 && Math.sign(toEnemyY) === dirY);

    if (isFrontCollision) {
      // 正面でぶつかった場合は移動を停止する
      this.stopStoneMovement(stone);
    }
  }

  /**
   * 石または氷を押した時の移動ロジック
   */
  private handleStonePush(player: Player, stone: Phaser.Physics.Arcade.Sprite) {
    if (stone.getData("isMoving")) return;

    // 向きの決定
    const dx = stone.x - player.x;
    const dy = stone.y - player.y;
    let moveX = 0;
    let moveY = 0;

    if (Math.abs(dx) > Math.abs(dy)) {
      moveX = dx > 0 ? 32 : -32;
    } else {
      moveY = dy > 0 ? 32 : -32;
    }

    // 押そうとした1マス先に敵がいるかチェック
    const nextGridX = stone.x + moveX;
    const nextGridY = stone.y + moveY;
    let isEnemyAhead = false;

    this.enemies.getChildren().forEach((e) => {
      const enemy = e as Phaser.Physics.Arcade.Sprite;
      // 1マス先の座標に敵がいればフラグを立てる
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, nextGridX, nextGridY) < 16) {
        isEnemyAhead = true;
      }
    });
    // 進行方向に敵がいたら動かさない
    if (isEnemyAhead) {
      return;
    }

    // 移動先の最終地点を計算
    const isIce = stone.getData("element") === "ICE"; // 氷判定
    const targetPos = this.calculateTargetPosition(stone, moveX, moveY, isIce);

    if (targetPos.x === stone.x && targetPos.y === stone.y) return;

    // アニメーション
    const distance = Phaser.Math.Distance.Between(stone.x, stone.y, targetPos.x, targetPos.y);
    const duration = (distance / 32) * 300;

    stone.setData("isMoving", true);
    stone.setData("targetX", targetPos.x);
    stone.setData("targetY", targetPos.y);

    this.tweens.add({
      targets: stone,
      x: targetPos.x,
      y: targetPos.y,
      duration: duration,
      ease: isIce ? "Linear" : "Cubic.easeOut",
      onUpdate: () => {
        if (stone.body) {
          (stone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
        }
      },
      onComplete: () => {
        stone.setData("isMoving", false);
        stone.setData("targetX", undefined);
        stone.setData("targetY", undefined);
        if (stone.body) (stone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
      },
      onKill: () => {
        stone.setData("isMoving", false);
        stone.setData("targetX", undefined);
        stone.setData("targetY", undefined);
        if (stone.body) (stone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
      },
    });
  }

  /**
   * 滑っている石を敵との衝突時に強制ストップ
   */
  private stopStoneMovement(stone: Phaser.Physics.Arcade.Sprite) {
    // 実行中の移動Tweenを強制終了
    this.tweens.killTweensOf(stone);
    // 中途半端な座標で止まらないよう、グリッドの中心にスナップ
    const snappedX = Math.floor(stone.x / 32) * 32 + 16;
    const snappedY = Math.floor(stone.y / 32) * 32 + 16;
    stone.setPosition(snappedX, snappedY);
  }

  /**
   * 障害物にぶつかるまでの最終座標を計算
   */
  private calculateTargetPosition(
    stone: Phaser.Physics.Arcade.Sprite,
    moveX: number,
    moveY: number,
    isIce: boolean,
  ): { x: number; y: number } {
    let currX = stone.x;
    let currY = stone.y;

    while (true) {
      const nextX = currX + moveX;
      const nextY = currY + moveY;

      // 移動先のマスに敵がいるかチェック
      const isEnemyInNextGrid = this.enemies.getChildren().some((e) => {
        const enemy = e as Phaser.Physics.Arcade.Sprite;
        return Phaser.Math.Distance.Between(enemy.x, enemy.y, nextX, nextY) < 16;
      });

      // 移動先が障害物または敵でブロックされているかチェック
      const isBlocked =
        isEnemyInNextGrid ||
        this.walls.getChildren().some((w) => (w as any).getBounds().contains(nextX, nextY)) ||
        this.breakableWalls.getChildren().some((w) => (w as any).getBounds().contains(nextX, nextY)) ||
        this.doors.getChildren().some((d) => (d as any).body.enable && (d as any).getBounds().contains(nextX, nextY)) ||
        this.movableStones.getChildren().some((s) => s !== stone && (s as any).getBounds().contains(nextX, nextY));

      if (isBlocked) break;

      // 座標を更新
      currX = nextX;
      currY = nextY;

      // 通常の石の場合は1マス進んで終了
      if (!isIce) break;

      // 無限ループ防止（マップ範囲外チェック）
      if (currX < 0 || currX > this.physics.world.bounds.width || currY < 0 || currY > this.physics.world.bounds.height)
        break;
    }
    return { x: currX, y: currY };
  }

  private setupItemCollisions() {
    if (!this.player) return;
    // player と items グループの接触を監視
    this.physics.add.overlap(
      this.player,
      this.items, // LevelBuilderで作成されたアイテムグループ
      this.handleItemPickup,
      undefined,
      this,
    );
  }

  // アイテムを拾った時の処理
  private handleItemPickup(playerObj: any, itemObj: any) {
    const player: Player = playerObj;
    const itemSprite = itemObj as Phaser.Physics.Arcade.Sprite;
    const config: TileConfig = itemSprite.getData("config");

    if (!config) return;

    // 鍵のパターン
    if (config.item && config.item.type === "KEY") {
      const itemData = config.item;
      if (itemData.targetDoorId) {
        player.addKey(itemData.targetDoorId);
        itemSprite.destroy();
        console.log(`${itemData.name}を拾った！`);
      }
      return;
    }

    // スコアアイテムのパターン
    if (config.item && config.item.type === "SCORE_ITEM") {
      const itemData = config.item;
      player.addScore(itemData.score || 0);
      itemSprite.destroy();
      console.log(`${itemData.name}を手に入れた！`);
      return;
    }

    // 武器のパターン
    if (config.weaponData) {
      player.equipWeapon(config.weaponData);
      itemSprite.destroy();
      console.log(`${config.name}を装備した！`);
      return;
    }

    // if (config.item && config.item.type === "WEAPON" && config.item.weaponData) {
    //   player.equipWeapon(config.item.weaponData);
    //   itemSprite.destroy();
    //   return;
    // }
  }

  private createTimerUI() {
    const { width } = this.scale;

    // 背景の黒半透明ボックス
    this.timeContainer = this.add.graphics();
    this.timeContainer.fillStyle(0x000000, 0.8);
    this.timeContainer.lineStyle(1, 0x00ffcc, 0.3);

    // 右上の固定位置に角丸長方形を描画
    const rectX = width - 210;
    const rectY = 20;
    const rectW = 190;
    const rectH = 55;
    this.timeContainer.fillRoundedRect(rectX, rectY, rectW, rectH, 8);
    this.timeContainer.strokeRoundedRect(rectX, rectY, rectW, rectH, 8);
    this.timeContainer.setScrollFactor(0); // カメラが動いても画面に固定
    this.timeContainer.setDepth(200); // 最前面に表示

    // TIME表示
    this.add
      .text(rectX + 15, rectY + 22, "TIME", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#94a3b8", // slate-400
      })
      .setScrollFactor(0)
      .setDepth(201);

    // メインの残り時間デジタル数字
    this.timeText = this.add
      .text(width - 30, rectY + 10, this.timeLimit.toFixed(3), {
        fontFamily: "monospace",
        fontSize: "30px",
        color: "#00ffcc",
        fontStyle: "bold",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(201);
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
      if (this.timeText) {
        this.timeText.setText(this.timeLeft.toFixed(3));
      }
    }
    // タイムアップ判定
    if (this.timeLeft <= 0) {
      this.triggerGameOver("TIME UP!", GAME_EVENTS.TIME_OVER);
    }

    if (this.player) {
      this.player.update();
      this.checkGoalCondition();
    }

    this.enemies.getChildren().forEach((enemy) => {
      enemy.update();
    });

    this.gimmickConnections.forEach((conn) => {
      const { button, door } = conn;
      if (door.getData("isLocked") === true) return;

      const isPressed = this.physics.overlap(this.player, button) || this.physics.overlap(this.movableStones, button);

      const dOpen = door.getData("openFrame") ?? 0;
      const dClosed = door.getData("closedFrame") ?? 1;
      const bOpen = button.getData("openFrame") ?? 1;
      const bClosed = button.getData("closedFrame") ?? 0;

      if (isPressed) {
        button.setFrame(bOpen);
        door.setFrame(dOpen);
        door.setAlpha(0.3);
        if (door.body) (door.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      } else {
        button.setFrame(bClosed);
        door.setFrame(dClosed);
        door.setAlpha(1.0);
        if (door.body) (door.body as Phaser.Physics.Arcade.StaticBody).enable = true;
      }
    });
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

    // todo: ゲームオーバー、タイムアウト時はいったんscoreは0とする
    const score = 0;
    this.game.events.emit(notificationType, { score, timeLeft: this.timeLeft });

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
    const mapWidth = this.tiles[0].length * this.tileSize;
    const mapHeight = this.tiles.length * this.tileSize;
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

  /**
   * 攻撃ヒット時の判定
   */
  private handleAttack(x: number, y: number, direction: { x: number; y: number }, weapon?: WeaponData) {
    const range = weapon ? weapon.range : 24;
    const size = weapon ? weapon.size : 20;
    const damage = weapon ? weapon.damage : 1;

    const attackX = x + direction.x * range;
    const attackY = y + direction.y * range;

    // 攻撃判定用の不可視オブジェクト
    const hitArea = this.add.rectangle(attackX, attackY, size, size, 0xffff00, 0);
    this.physics.add.existing(hitArea);

    // エフェクトを画面に表示
    let effect = null;
    if (weapon?.id == "SWORD") {
      effect = this.add.sprite(attackX, attackY, "weaponSwordAttackEffect");
    }
    if (effect) {
      if (direction.x === 1)
        effect.setAngle(270); // 右向き
      else if (direction.x === -1)
        effect.setAngle(90); // 左向き
      else if (direction.y === 1)
        effect.setAngle(0); // 下向き
      else if (direction.y === -1) effect.setAngle(180); // 上向き
    }

    // 石への攻撃
    this.physics.overlap(hitArea, this.movableStones, (_, stoneObject) => {
      const stone = stoneObject as Phaser.Physics.Arcade.Sprite;

      // すでに移動中なら重ねて処理しない
      if (stone.getData("isMoving")) return;

      const stoneType = stone.getData("stoneType");
      const element = stone.getData("element");

      if (stoneType === "BREAKABLE") {
        this.breakStone(stone, element);
        return;
      }

      if (stoneType === "NORMAL" || stoneType === "HEAVY") {
        this.moveStoneByAttack(stone, direction);
      }
    });

    // 敵へのダメージ
    this.physics.overlap(hitArea, this.enemies, (_, target) => {
      if (target instanceof Enemy) {
        const enemyData: EnemyData = target.getEnemyData();

        // ムテキてきには攻撃が効かない
        const isInvincible: boolean = enemyData.isInvincible || false;
        if (isInvincible) {
          console.log(`攻撃が効かない！`);
          return;
        }

        // 倒したら、スコア追加
        const score: number = target.takeDamage(damage);
        if (score > 0) {
          this.player.addScore(score);
          console.log(`${enemyData.name}を倒した！！`);
        } else {
          console.log(`${enemyData.name}に${damage}のダメージ！！`);
        }
      }
      // Todo:武器の耐久度を減らす
      // this.player.consumeWeaponCharge();
    });

    // 壊れる壁へのダメージ
    this.physics.overlap(hitArea, this.breakableWalls, (_, wall) => {
      this.handleObjectDamage(wall as Phaser.GameObjects.Sprite);
      // Todo:武器の耐久度を減らす
      // this.player.consumeWeaponCharge();
    });

    // 判定オブジェクトとエフェクト画像を一定時間（100ms）後に一緒に消去する
    this.time.delayedCall(100, () => {
      hitArea.destroy();
      if (effect) effect.destroy();
    });
  }

  /**
   * 壊れる石・氷を破壊する処理
   */
  private breakStone(stone: Phaser.Physics.Arcade.Sprite, element: "STONE" | "ICE") {
    if (stone.body instanceof Phaser.Physics.Arcade.Body) {
      stone.body.enable = false;
    }

    // 破壊するときの演出
    const flashColor = element === "ICE" ? 0x00ffff : 0xffa500;
    stone.setTint(flashColor);

    this.tweens.add({
      targets: stone,
      alpha: 0,
      scale: 0.5,
      duration: 100,
      onComplete: () => {
        // todo: SEを追加する
        // グループとシーンから完全に削除
        this.movableStones.remove(stone, true, true);
      },
    });
  }

  /**
   * 攻撃によって石・氷を飛ばす
   */
  private moveStoneByAttack(stone: Phaser.Physics.Arcade.Sprite, direction: { x: number; y: number }) {
    if (stone.getData("isMoving")) return;

    const moveX = direction.x * 32;
    const moveY = direction.y * 32;

    // 押そうとした1マス先に敵がいるかチェック
    const nextGridX = stone.x + moveX;
    const nextGridY = stone.y + moveY;
    let isEnemyAhead = false;

    this.enemies.getChildren().forEach((e) => {
      const enemy = e as Phaser.Physics.Arcade.Sprite;
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, nextGridX, nextGridY) < 16) {
        isEnemyAhead = true;
      }
    });

    // 目の前に敵がいる場合は動かさない
    if (isEnemyAhead) return;

    const isIce = stone.getData("element") === "ICE";

    // 障害物にぶつかるまでの最終座標を計算
    const targetPos = this.calculateTargetPosition(stone, moveX, moveY, isIce);

    if (targetPos.x === stone.x && targetPos.y === stone.y) return;

    const distance = Phaser.Math.Distance.Between(stone.x, stone.y, targetPos.x, targetPos.y);
    const duration = isIce ? (distance / 32) * 120 : 120;

    stone.setData("isMoving", true);
    stone.setData("targetX", targetPos.x);
    stone.setData("targetY", targetPos.y);

    this.tweens.add({
      targets: stone,
      x: targetPos.x,
      y: targetPos.y,
      duration: duration,
      ease: "Linear",
      onUpdate: () => {
        if (stone.body) {
          (stone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
        }
      },
      onComplete: () => {
        stone.setData("isMoving", false);
        stone.setData("targetX", undefined);
        stone.setData("targetY", undefined);
        if (stone.body) (stone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
      },
      onKill: () => {
        stone.setData("isMoving", false);
        stone.setData("targetX", undefined);
        stone.setData("targetY", undefined);
        if (stone.body) (stone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
      },
    });
  }

  /**
   * 壁などの汎用ダメージ処理
   */
  private handleObjectDamage(target: Phaser.GameObjects.Sprite) {
    const hp = target.getData("hp") - 1;
    if (hp <= 0) {
      target.destroy();
    } else {
      target.setData("hp", hp);
      target.setTint(0xff0000);
      this.time.delayedCall(100, () => target.clearTint());
      this.tweens.add({ targets: target, x: target.x + 2, duration: 50, yoyo: true });
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
