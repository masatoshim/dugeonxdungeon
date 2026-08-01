import * as Phaser from "phaser";
import { AssetKey } from "@/game-core/master";
import { EnemyData } from "@/game-core/types";
import { MainScene } from "@/game-core/scenes/main/MainScene";
import { Player } from "@/game-core/entities/Player";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private moveEvent!: Phaser.Time.TimerEvent;
  private enemyData: EnemyData;
  private animKeyPrefix: string;

  // CHASE2用の追跡状態フラグと現在の向き
  private isChasing2: boolean = false;
  private currentFacing: { x: number; y: number } = { x: 0, y: 1 };

  constructor(scene: Phaser.Scene, x: number, y: number, texture: AssetKey, frame: number, enemyData: EnemyData) {
    super(scene, x, y, texture, frame);

    this.enemyData = enemyData;
    this.animKeyPrefix = `anim-${this.enemyData.id.toLowerCase()}-${this.texture.key}`;

    // シーンへの追加と物理エンジンの有効化
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // ボディサイズの同期
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(this.enemyData.xsize || this.width, this.enemyData.ysize || this.height);
      body.setOffset(this.enemyData.xoffset || 0, this.enemyData.yoffset || 0);
      this.setCollideWorldBounds(true);
      this.setDepth(2);
    }

    if (this.enemyData.isGhost) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        this.setCollideWorldBounds(true);
        this.setBounce(0, 0);
        this.setDepth(5);

        body.checkCollision.up = false;
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
      }
    }

    // 初期ステータス設定
    this.setData("hp", this.enemyData.hp);
    this.setBounce(0, 0);
    this.setDrag(0);

    // 敵固有のアニメーション登録
    this.setupAnimations();

    this.moveEvent = scene.time.addEvent({
      delay: 10,
      callback: this.changeDirection,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * 敵固有のアニメーション設定
   */
  private setupAnimations() {
    const anims = this.scene.anims;

    if (this.enemyData.animType === "SINGLE" || !this.enemyData.animType) {
      if (!anims.exists(this.animKeyPrefix)) {
        anims.create({
          key: this.animKeyPrefix,
          frames: anims.generateFrameNumbers(this.texture.key, { start: 0, end: (this.enemyData.animSize || 1) - 1 }),
          frameRate: this.enemyData.frameRate || 10,
          repeat: -1,
        });
      }
      // シンクロを回避するロジック
      const totalFrames = anims.get(this.animKeyPrefix).frames.length;
      const randomStartFrame = Phaser.Math.Between(0, totalFrames - 1);
      this.play({ key: this.animKeyPrefix, startFrame: randomStartFrame });
    } else if (this.enemyData.animType.startsWith("DIRECTIONAL")) {
      const directionsMap: Record<string, { suffix: string; frames: number[] }[]> = {
        DIRECTIONAL: [
          { suffix: "down", frames: [0, 1, 0, 2] },
          { suffix: "left", frames: [3, 4, 3, 5] },
          { suffix: "right", frames: [6, 7, 6, 8] },
          { suffix: "up", frames: [9, 10, 9, 11] },
        ],
        DIRECTIONAL_2: [
          { suffix: "down", frames: [0, 1, 2, 1] },
          { suffix: "left", frames: [3, 4, 5, 4] },
          { suffix: "right", frames: [6, 7, 8, 7] },
          { suffix: "up", frames: [9, 10, 11, 10] },
        ],
      };
      const directions = directionsMap[this.enemyData.animType] || directionsMap["DIRECTIONAL"];

      directions.forEach((d) => {
        const key = `${this.animKeyPrefix}-${d.suffix}`;
        if (!anims.exists(key)) {
          anims.create({
            key: key,
            frames: anims.generateFrameNumbers(this.texture.key, { frames: d.frames }),
            frameRate: this.enemyData.frameRate || 10,
            repeat: -1,
          });
        }
      });

      const defaultKey = `${this.animKeyPrefix}-down`;
      const totalFrames = anims.get(defaultKey).frames.length;
      const randomStartFrame = Phaser.Math.Between(0, totalFrames - 1);
      this.play({ key: defaultKey, startFrame: randomStartFrame });
    }
  }

  protected preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    if (!this.active || !this.body) return;

    if (this.enemyData.isGhost) {
      // 外壁の範囲を計算
      const minX = 32 + this.width / 2;
      const minY = 32 + this.height / 2;

      const mapWidth = this.scene.physics.world.bounds.width;
      const mapHeight = this.scene.physics.world.bounds.height;

      const maxX = mapWidth - 32 - this.width / 2;
      const maxY = mapHeight - 32 - this.height / 2;

      // 範囲外に出そうになっているか判定
      const isAtBoundaryX = this.x <= minX || this.x >= maxX;
      const isAtBoundaryY = this.y <= minY || this.y >= maxY;

      // 座標を枠内に固定
      this.x = Phaser.Math.Clamp(this.x, minX, maxX);
      this.y = Phaser.Math.Clamp(this.y, minY, maxY);

      // 外枠に到達していて、かつその方向へ進もうとしている場合は方向転換を実行
      if (
        (isAtBoundaryX && Math.abs(this.body.velocity.x) > 0) ||
        (isAtBoundaryY && Math.abs(this.body.velocity.y) > 0)
      ) {
        this.changeDirection();
      }
    }

    this.updateAnimationByVelocity(this.body.velocity.x, this.body.velocity.y);
  }

  public update() {
    if (!this.active || !this.body) return;

    // 巡回中に視界内にプレイヤーが入ったかをチェック
    if (this.enemyData.moveType === "CHASE_2") {
      this.updateChase2State();
    }

    if (this.enemyData.isGhost) return;

    // 壁にぶつかった瞬間の緊急ターン
    if (this.enemyData.moveType === "HORIZONTAL") {
      if (this.body.blocked.left || this.body.touching.left || this.body.blocked.right || this.body.touching.right) {
        this.changeDirection();
      }
    } else if (this.enemyData.moveType === "VERTICAL") {
      if (this.body.blocked.down || this.body.touching.down || this.body.blocked.up || this.body.touching.up) {
        this.changeDirection();
      }
    } else if (this.enemyData.moveType === "RANDOM" || (this.enemyData.moveType === "CHASE_2" && !this.isChasing2)) {
      const b = this.body.blocked;
      const t = this.body.touching;
      if (b.left || t.left || b.right || t.right || b.up || t.up || b.down || t.down) {
        this.changeDirection();
      }
    }
  }

  /**
   * 移動処理のエントリポイント
   */
  private changeDirection() {
    switch (this.enemyData.moveType) {
      case "HORIZONTAL":
        this.moveHorizontal();
        break;
      case "VERTICAL":
        this.moveVertical();
        break;
      case "RANDOM":
        this.moveRandom();
        break;
      case "CHASE":
        this.moveChase();
        break;
      case "CHASE_2":
        this.moveChase2();
        break;
    }
  }

  private moveHorizontal() {
    if (!this.active || !this.body) return;

    const speed = this.enemyData.speed || 50;
    const moveSteps = this.enemyData.moveSteps || 1;

    if (this.getData("isMovingLeft") === undefined) {
      this.setData("isMovingLeft", Phaser.Math.RND.pick([true, false]));
    }

    let isMovingLeft = this.getData("isMovingLeft");

    if (this.body.blocked.left || this.body.touching.left) {
      isMovingLeft = false;
    } else if (this.body.blocked.right || this.body.touching.right) {
      isMovingLeft = true;
    } else {
      const shouldTurn = Phaser.Math.RND.pick([true, false]);
      if (shouldTurn) {
        isMovingLeft = !isMovingLeft;
      }
    }

    this.setData("isMovingLeft", isMovingLeft);
    this.setVelocity(isMovingLeft ? -speed : speed, 0);

    this.setFlipX(!isMovingLeft);

    const nextDelay = ((moveSteps * 32) / speed) * 1000 + 100;
    this.moveEvent.reset({
      delay: nextDelay,
      callback: this.changeDirection,
      callbackScope: this,
      loop: true,
    });
  }

  private moveVertical() {
    if (!this.active || !this.body) return;

    const speed = this.enemyData.speed || 50;
    const moveSteps = this.enemyData.moveSteps || 1;

    if (this.getData("isMovingUp") === undefined) {
      this.setData("isMovingUp", Phaser.Math.RND.pick([true, false]));
    }

    let isMovingUp = this.getData("isMovingUp");

    if (this.body.blocked.up || this.body.touching.up) {
      isMovingUp = false;
    } else if (this.body.blocked.down || this.body.touching.down) {
      isMovingUp = true;
    } else {
      const shouldTurn = Phaser.Math.RND.pick([true, false]);
      if (shouldTurn) {
        isMovingUp = !isMovingUp;
      }
    }

    this.setData("isMovingUp", isMovingUp);
    this.setVelocity(0, isMovingUp ? -speed : speed);

    this.setFlipY(isMovingUp);

    const nextDelay = ((moveSteps * 32) / speed) * 1000 + 100;
    this.moveEvent.reset({
      delay: nextDelay,
      callback: this.changeDirection,
      callbackScope: this,
      loop: true,
    });
  }

  private moveRandom() {
    if (!this.active || !this.body) return;

    const speed = this.enemyData.speed || 50;
    const moveSteps = this.enemyData.moveSteps || 1;

    // 現在ブロックされている方向以外の移動候補を抽出する
    const b = this.body.blocked;
    const t = this.body.touching;

    const validDirections: [number, number][] = [];
    if (!b.left && !t.left) validDirections.push([-1, 0]);
    if (!b.right && !t.right) validDirections.push([1, 0]);
    if (!b.up && !t.up) validDirections.push([0, -1]);
    if (!b.down && !t.down) validDirections.push([0, 1]);

    // 全方向塞がれている場合などのフォールバック
    const dir =
      validDirections.length > 0
        ? Phaser.Math.RND.pick(validDirections)
        : Phaser.Math.RND.pick([
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]);

    this.setVelocity(dir[0] * speed, dir[1] * speed);

    const nextDelay = moveSteps > 0 ? ((moveSteps * 32) / speed) * 1000 : Phaser.Math.Between(1000, 2000);

    this.moveEvent.reset({
      delay: nextDelay,
      callback: this.changeDirection,
      callbackScope: this,
      loop: true,
    });
  }

  private moveChase(speedUp?: number) {
    if (!this.active || !this.body) return;

    const speed = (this.enemyData.speed || 50) * (speedUp || 1);
    const mainScene = this.scene as MainScene;
    const currentPlayer: Player = mainScene.getPlayer();

    if (!currentPlayer || !currentPlayer.active) {
      this.setVelocity(0, 0);
      return;
    }

    const diffX = currentPlayer.x - this.x;
    const diffY = currentPlayer.y - this.y;

    let moveX = Math.abs(diffX) < 4 ? 0 : Math.sign(diffX);
    let moveY = Math.abs(diffY) < 4 ? 0 : Math.sign(diffY);

    if (!this.enemyData.isGhost) {
      const blocked = this.body.blocked;
      const isBlockedX = (moveX > 0 && blocked.right) || (moveX < 0 && blocked.left);
      const isBlockedY = (moveY > 0 && blocked.down) || (moveY < 0 && blocked.up);

      if (isBlockedX && !isBlockedY) {
        moveX = 0;
        if (moveY === 0) moveY = 1;
      } else if (isBlockedY && !isBlockedX) {
        moveY = 0;
        if (moveX === 0) moveX = 1;
      }
    }

    const factor = moveX !== 0 && moveY !== 0 ? 0.707 : 1;
    this.setVelocity(moveX * speed * factor, moveY * speed * factor);
  }

  private moveChase2() {
    if (!this.active || !this.body) return;

    if (this.isChasing2) {
      // 追跡中の場合は moveChase と同じ移動を行う
      this.moveChase(this.enemyData.speedUp);
      // 追跡中はタイマーを頻繁に呼び出して追跡速度を維持
      this.moveEvent.reset({
        delay: 50,
        callback: this.changeDirection,
        callbackScope: this,
        loop: true,
      });
    } else {
      // 通常時はランダム移動
      this.moveRandom();
    }
  }

  /**
   * CHASE2用の状態監視（視界判定・距離判定）
   */
  private updateChase2State() {
    const mainScene = this.scene as MainScene;
    const player: Player = mainScene.getPlayer();
    if (!player || !player.active) {
      if (this.isChasing2) {
        this.isChasing2 = false;
        this.changeDirection();
      }
      return;
    }

    const maxDistance = (this.enemyData.chaseDistance || 5) * 32;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (this.isChasing2) {
      // 追跡中：距離が一定以上離れたらランダム移動に戻る
      if (dist > maxDistance) {
        this.isChasing2 = false;
        this.changeDirection();
      }
    } else {
      // ランダム移動中：一定距離内 かつ 進行方向の視界内にプレイヤーがいるか確認
      if (dist <= maxDistance && this.isLineOfSightBlocked(player)) {
        this.isChasing2 = true;
        this.changeDirection();
      }
    }
  }

  /**
   * プレイヤーが敵の進行方向にいるか判定
   */
  private isLineOfSightBlocked(player: Player): boolean {
    const mainScene = this.scene as MainScene;
    const ray = new Phaser.Geom.Line(this.x, this.y, player.x, player.y);

    // 視線チェックの対象とするグループ一覧を取得
    const obstacleGroups: (Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup)[] = [
      mainScene.getWalls(),
      mainScene.getBreakableWalls(),
      mainScene.getDoors(),
      mainScene.getMovableStones(),
    ];

    for (const group of obstacleGroups) {
      if (!group) continue;

      const children = group.getChildren() as Phaser.Physics.Arcade.Sprite[];

      for (const child of children) {
        // 非アクティブなオブジェクトや物理ボディを持たないものはスキップ
        if (!child.active || !child.body) continue;

        // 閉じている扉や鍵がかかっている扉のみ遮蔽物とする場合のケア
        if (group === mainScene.getDoors() && child.getData("isLocked") === false) {
          continue;
        }

        const body = child.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
        const rect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);

        // 視線と障害物の矩形が交差しているか判定
        if (Phaser.Geom.Intersects.LineToRectangle(ray, rect)) {
          return true; // 遮蔽物あり
        }
      }
    }
    return false; // 遮蔽物なし（プレイヤーが見える）
  }

  /**
   * 与えられた速度に基づいてアニメーションを変更する
   */
  private updateAnimationByVelocity(vx: number, vy: number) {
    if (!this.enemyData.animType?.startsWith("DIRECTIONAL")) return;

    const absX = Math.abs(vx);
    const absY = Math.abs(vy);

    if (absX < 1 && absY < 1) return;

    let suffix = "";

    // 縦移動が強い場合は縦を優先
    if (absY >= absX) {
      suffix = vy > 0 ? "down" : "up";
      this.currentFacing = { x: 0, y: vy > 0 ? 1 : -1 };
    } else {
      suffix = vx > 0 ? "right" : "left";
      this.currentFacing = { x: vx > 0 ? 1 : -1, y: 0 };
    }

    const targetKey = `${this.animKeyPrefix}-${suffix}`;

    if (this.anims.currentAnim?.key !== targetKey) {
      this.anims.play(targetKey, true);
    }
  }

  /**
   * ダメージ処理
   */
  public takeDamage(amount: number) {
    const hp = this.getData("hp") - amount;
    this.setData("hp", hp);

    if (hp <= 0) {
      this.moveEvent.destroy();
      this.destroy();
      return this.enemyData.score;
    } else {
      this.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        if (this.active) this.clearTint();
      });
      return 0;
    }
  }

  public getEnemyData() {
    return this.enemyData;
  }
}
