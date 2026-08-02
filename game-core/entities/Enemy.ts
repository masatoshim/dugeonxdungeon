import * as Phaser from "phaser";
import { AssetKey } from "@/game-core/master";
import { EnemyData } from "@/game-core/types";
import { MainScene } from "@/game-core/scenes/main/MainScene";
import { Player } from "@/game-core/entities/Player";
import { EnemyBullet } from "@/game-core/entities//EnemyBullet";

// 状態定義
type RangedState = "IDLE" | "PREPARE" | "ATTACK" | "COOLDOWN";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private moveEvent!: Phaser.Time.TimerEvent;
  private enemyData: EnemyData;
  private animKeyPrefix: string;

  // CHASE2用の追跡状態フラグと現在の向き
  private isChasing2: boolean = false;
  private currentFacing: { x: number; y: number } = { x: 0, y: 1 };

  // 遠隔攻撃用の状態プロパティ
  private rangedState: RangedState = "IDLE";
  private lastRangedAttackTime: number = 0;

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

    //　ゴースト制御
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

    // ステルス敵の視認性制御
    this.updateStealthState();

    this.updateAnimationByVelocity(this.body.velocity.x, this.body.velocity.y);
  }

  /**
   * プレイヤーとの距離に応じて透明度を更新
   */
  private updateStealthState() {
    const enemyData = this.enemyData;
    const mainScene = this.scene as MainScene;
    const currentPlayer: Player = mainScene.getPlayer();
    if (!enemyData.isStealth || !currentPlayer) return;

    // プレイヤーと敵の距離を計算
    const distance = Phaser.Math.Distance.Between(this.x, this.y, currentPlayer.x, currentPlayer.y);
    // 視認距離
    const detectDist = (enemyData.detectDistance || 3) * 32;

    if (distance <= detectDist) {
      // 透明度
      const alpha = Phaser.Math.Clamp(1 - distance / detectDist, 0.2, 1.0);
      this.setAlpha(alpha);
      this.setVisible(true);
    } else {
      this.setAlpha(0);
      this.setVisible(false); // 完全に隠す場合
    }
  }

  public update() {
    if (!this.active || !this.body) return;

    if (this.enemyData.moveType === "RANGED") {
      this.updateRangedState();
      return;
    }

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
      case "RANGED":
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
   * 遠隔攻撃タイプの状態更新
   */
  private updateRangedState() {
    if (!this.active || !this.body) return;

    const mainScene = this.scene as MainScene;
    const player = mainScene.getPlayer();
    if (!player || !player.active) return;

    const rData = this.enemyData.rangedData;
    const maxDistance = (this.enemyData.chaseDistance || 6) * 32;
    const prepareTime = rData?.prepareTime ?? 1000;
    const cooldown = rData?.cooldown ?? 3000;

    // 溜め中・攻撃中は完全に足止め
    if (this.rangedState === "PREPARE" || this.rangedState === "ATTACK") {
      this.setVelocity(0, 0);
      return;
    }

    // プレイヤーの発見判定
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const canSeePlayer = dist <= maxDistance && !this.isLineOfSightBlocked(player);
    if (canSeePlayer && this.scene.time.now - this.lastRangedAttackTime > cooldown) {
      // 攻撃シーケンス開始
      this.startRangedAttackSequence(player, prepareTime, cooldown);
    } else if (this.rangedState === "IDLE") {
      if (this.body.velocity.x === 0 && this.body.velocity.y === 0) {
        this.changeDirection();
      }
    }
  }

  /**
   * 遠隔攻撃開始準備
   */
  private startRangedAttackSequence(player: Player, prepareTime: number, cooldown: number) {
    this.rangedState = "PREPARE";
    this.setVelocity(0, 0);

    // プレイヤーの方向へ向き直る
    const dirX = player.x - this.x;
    const dirY = player.y - this.y;
    this.updateAnimationByVelocity(dirX, dirY);

    // 予兆演出
    this.setTint(0xff8888);

    // 溜め時間経過後に攻撃発射
    this.scene.time.delayedCall(prepareTime, () => {
      if (!this.active) return;
      // 予兆演出の解除
      this.clearTint();
      this.rangedState = "ATTACK";

      // 弾の発射
      this.executeRangedShot(player, () => {
        // 撃ち終わったらクールダウンへ移行
        this.rangedState = "COOLDOWN";
        this.lastRangedAttackTime = this.scene.time.now;

        // クールタイム終了後にIDLEに戻って移動再開
        this.scene.time.delayedCall(cooldown, () => {
          if (this.active) {
            this.rangedState = "IDLE";
            this.changeDirection();
          }
        });
      });
    });
  }

  /**
   * 弾を発射
   */
  private executeRangedShot(player: Player, onComplete: () => void) {
    const mainScene = this.scene as MainScene;
    const rData = this.enemyData.rangedData;

    const bulletTexture = rData?.bulletTexture || ("bullet-default" as AssetKey);
    const speed = rData?.bulletSpeed ?? 200;
    const shotCount = rData?.shotCount ?? 1;
    const shotInterval = rData?.shotInterval ?? 150;

    let shotsFired = 0;

    // 1発発射する共通処理関数
    const fireSingleBullet = () => {
      if (!this.active || !player.active) return false;

      // 発射時点のプレイヤー位置に向けてベクトル計算
      const dirX = player.x - this.x;
      const dirY = player.y - this.y;

      // 弾インスタンス生成時
      const bullet = new EnemyBullet(this.scene, this.x, this.y, bulletTexture, dirX, dirY, speed, rData?.bulletAnim);

      // シーンの物理グループに追加登録
      mainScene.registerEnemyBullet(bullet);

      // グループ追加時に速度がリセットされる場合があるため、登録後にも再度速度を保証
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      if (body) {
        const vec = new Phaser.Math.Vector2(dirX, dirY).normalize();
        body.setVelocity(vec.x * speed, vec.y * speed);
      }

      shotsFired++;
      return true;
    };

    // 1発目は即座に発射する
    const success = fireSingleBullet();
    if (!success || shotsFired >= shotCount) {
      onComplete();
      return;
    }

    // 2発目以降がある場合はタイマーで連射
    const timer = this.scene.time.addEvent({
      delay: shotInterval,
      repeat: shotCount - 2,
      callback: () => {
        const continues = fireSingleBullet();
        if (!continues || shotsFired >= shotCount) {
          timer.destroy();
          onComplete();
        }
      },
    });
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
      if (dist <= maxDistance && !this.isLineOfSightBlocked(player)) {
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
