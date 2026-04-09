import * as Phaser from "phaser";
import { ASSETS, MapData, WeaponData, GimmickConnection } from "@/types";
import { Player } from "@/game-core/entities/Player";
import { Enemy } from "@/game-core/entities/Enemy";
import { LevelBuilder, LevelGroups } from "@/game-core/builders/LevelBuilder";

export class MainScene extends Phaser.Scene {
  // データ管理
  private tiles!: string[][];
  private timeLeft: number = 0;
  private timerEvent?: Phaser.Time.TimerEvent;
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

  constructor() {
    super("MainScene");
  }

  init(data: { mapData: MapData; timeLimit: number }) {
    this.mapData = data.mapData;
    this.tiles = data.mapData.tiles;
    this.timeLeft = data.timeLimit ?? 60;
    this.levelBuilder = new LevelBuilder(this);
  }

  preload() {
    Object.entries(ASSETS).forEach(([key, path]) => {
      if (key === "tileset" || key === "items" || key === "stones" || key === "doors" || key === "buttons") {
        this.load.spritesheet(key, path, { frameWidth: 32, frameHeight: 32 });
      } else {
        this.load.image(key, path);
      }
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

    this.startCountdown();
  }

  private setupPhysics() {
    if (!this.player) return;

    // 静的オブジェクトとの衝突
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.breakableWalls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.enemies, this.breakableWalls);

    // 石との衝突処理：物理的な押し出しではなく、handleStonePush を実行する
    this.physics.add.collider(this.player, this.movableStones, (p, s) => {
      this.handleStonePush(p as Player, s as Phaser.Physics.Arcade.Sprite);
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

    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerDeath, undefined, this);
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

    // 移動先の最終地点を計算
    const isIce = stone.getData("config")?.category === "ICE" || stone.texture.key === "ice"; // 氷判定
    const targetPos = this.calculateTargetPosition(stone, moveX, moveY, isIce);

    if (targetPos.x === stone.x && targetPos.y === stone.y) return;

    // アニメーション
    const distance = Phaser.Math.Distance.Between(stone.x, stone.y, targetPos.x, targetPos.y);
    const duration = (distance / 32) * 300;

    stone.setData("isMoving", true);
    this.tweens.add({
      targets: stone,
      x: targetPos.x,
      y: targetPos.y,
      duration: duration,
      ease: isIce ? "Linear" : "Cubic.easeOut", // 氷は等速、石は少し減速気味に
      onComplete: () => {
        stone.setData("isMoving", false);
        if (stone.body) (stone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
      },
    });
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

      // 移動先がブロックされているかチェック
      const isBlocked =
        this.walls.getChildren().some((w) => (w as any).getBounds().contains(nextX, nextY)) ||
        this.breakableWalls.getChildren().some((w) => (w as any).getBounds().contains(nextX, nextY)) ||
        this.doors.getChildren().some((d) => (d as any).body.enable && (d as any).getBounds().contains(nextX, nextY)) ||
        this.movableStones.getChildren().some((s) => s !== stone && (s as any).getBounds().contains(nextX, nextY));

      if (isBlocked) break;

      // 座標を更新
      currX = nextX;
      currY = nextY;

      // 「石」の場合は1回（1マス）でループ終了
      if (!isIce) break;

      // 無限ループ防止（マップ範囲外チェックなど）
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
    const player = playerObj as Player;
    const itemSprite = itemObj as Phaser.Physics.Arcade.Sprite;
    const config = itemSprite.getData("config") as any; // 一旦 any で構造の違いを許容

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

  update() {
    if (this.player) {
      this.player.update();
      this.checkGoalCondition();
    }

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
   * プレイヤーが死亡した時の処理
   */
  private handlePlayerDeath(playerObj: any, enemyObj: any) {
    // すでにゲームオーバー状態なら何もしない
    if (!this.player.active) return;
    // 物理演算を停止
    this.physics.pause();
    // プレイヤーを赤くして、動きを止める
    const player = playerObj as Player;
    player.setTint(0xff0000); // ToDo: 画像差し替え
    player.active = false;
    // 画面中央に「GAME OVER」テキストを表示
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, "GAME OVER", {
        fontSize: "48px",
        color: "#ff0000",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
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

  private startCountdown() {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        window.dispatchEvent(new CustomEvent("update-time", { detail: this.timeLeft }));
        if (this.timeLeft <= 0) this.handleGameOver("TIME UP!");
      },
      loop: true,
    });
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

    // 敵へのダメージ
    this.physics.overlap(hitArea, this.enemies, (_, target) => {
      if (target instanceof Enemy) target.takeDamage(damage);
      // Todo:武器の耐久度を減らす
      // this.player.consumeWeaponCharge();
    });

    // 壊れる壁へのダメージ
    this.physics.overlap(hitArea, this.breakableWalls, (_, wall) => {
      this.handleObjectDamage(wall as Phaser.GameObjects.Sprite);
      // Todo:武器の耐久度を減らす
      // this.player.consumeWeaponCharge();
    });

    this.time.delayedCall(100, () => hitArea.destroy());
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
    if (this.timerEvent?.paused) return;
    this.timerEvent!.paused = true;
    this.physics.pause();
    this.player.setTint(0x00ff00);
    // カメラを少しズーム
    this.cameras.main.zoomTo(1.2, 1000, "Power2");
    // クリア演出の実行
    this.showClearUI();
    window.dispatchEvent(
      new CustomEvent("game-clear", {
        detail: { score: this.timeLeft },
      }),
    );
  }

  private showClearUI() {
    const { width, height } = this.scale;
    // Todo: 画像に差し替える
    const container = this.add.container(width / 2, height / 2).setScrollFactor(0);
    // テキスト（将来の画像）
    const msg = this.add
      .text(0, -50, "STAGE CLEAR!", {
        fontSize: "64px",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const score = this.add
      .text(0, 20, `TIME BONUS: ${this.timeLeft}`, {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    container.add([msg, score]);
    container.setScale(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      duration: 800,
      ease: "Back.easeOut",
      delay: 200,
    });
  }

  private handleGameOver(message: string) {
    this.timerEvent?.remove();
    this.physics.pause();
    this.player.setTint(0x555555);
  }

  private checkGoalCondition() {
    if (this.timerEvent?.paused) return;
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
