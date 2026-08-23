import * as Phaser from "phaser";
import { EnemyData, TILE_SIZE } from "@/game-core/types";
import { AssetKey } from "@/game-core/master";
import { Enemy } from "@/game-core/entities/Enemy";
import { MainScene } from "@/game-core/scenes/main/MainScene";
import { Player } from "@/game-core/entities/Player";
import { FootstompTrap } from "@/game-core/entities/FootstompTrap";
import { EnemyBullet } from "@/game-core/entities/EnemyBullet";

export class EnemyManager {
  private scene: Phaser.Scene;
  private group!: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 敵グループをセット
   * @param enemies
   */
  public setupEnemiesGroup(enemies: Phaser.Physics.Arcade.Group) {
    this.group = enemies;
  }

  /**
   * 敵生成処理
   * @param x
   * @param y
   * @param texture
   * @param frame
   * @param enemyData
   * @returns
   */
  public createEnemy(x: number, y: number, texture: AssetKey, frame: number, enemyData: EnemyData): Enemy {
    const enemy = new Enemy(this.scene, x, y, texture, frame, enemyData);
    this.group.add(enemy);

    // MIRRORタイプはプレイヤーの移動にリアルタイム連動するため、タイマー制御不要
    if (enemyData.moveType !== "MIRROR") {
      enemy.moveEvent = this.scene.time.addEvent({
        delay: 10,
        callback: () => this.changeDirection(enemy),
        loop: true,
      });
    }

    // destroy時に実行するメソッド指定
    enemy.once("destroy", () => {
      enemy.cleanup();
    });

    return enemy;
  }

  public update(): void {
    const enemies = this.group.getChildren() as Enemy[];

    enemies.forEach((enemy) => {
      if (!enemy.active || !enemy.body) return;

      const enemyData = enemy.getEnemyData();

      // ゴースト範囲制限
      if (enemyData.isGhost) {
        this.handleGhostBoundaries(enemy);
      }

      // ステルス状態の計算
      this.updateStealthState(enemy);

      // 移動アニメーション更新
      if (enemyData.animType?.startsWith("DIRECTIONAL")) {
        const vx = enemy.body.velocity.x;
        const vy = enemy.body.velocity.y;
        if (Math.abs(vx) >= 1 || Math.abs(vy) >= 1) {
          enemy.setFacingDirection(vx, vy);
        }
      }

      // スタン中でなければAIと足跡処理を進行
      if (!enemy.isStunned()) {
        this.updateEnemyAI(enemy);
        this.updateFootstomp(enemy);
      }
    });
  }

  /**
   * 足跡生成
   * @param enemy
   * @returns
   */
  private updateFootstomp(enemy: Enemy): void {
    const enemyData = enemy.getEnemyData();
    if (!enemyData.footstompData || !enemy.body) return;

    // 現在のマス座標を計算
    const currentTileX = Math.floor(enemy.x / TILE_SIZE);
    const currentTileY = Math.floor(enemy.y / TILE_SIZE);

    // 初期化
    if (enemy.lastTileX === null || enemy.lastTileY === null) {
      enemy.lastTileX = currentTileX;
      enemy.lastTileY = currentTileY;
      return;
    }

    // 1マス分移動したか判定
    if (currentTileX !== enemy.lastTileX || currentTileY !== enemy.lastTileY) {
      // 離れた直前のマスの中心座標を算出
      const trapWorldX = enemy.lastTileX * TILE_SIZE + TILE_SIZE / 2;
      const trapWorldY = enemy.lastTileY * TILE_SIZE + TILE_SIZE / 2;

      // 移動方向から回転角度を計算
      let rotationAngle = 0;
      if (enemyData.footstompData.hasDirection) {
        const vx = enemy.body.velocity.x;
        const vy = enemy.body.velocity.y;

        if (Math.abs(vx) > Math.abs(vy)) {
          rotationAngle = vx > 0 ? 90 : 270; // 右:90度, 左:270度
        } else {
          rotationAngle = vy > 0 ? 180 : 0; // 下:180度, 上:0度
        }
      }

      const duration = enemyData.footstompData.duration ?? 10000;
      const footstompData = enemyData.footstompData;
      const frameNo = footstompData.animSize ?? 1;
      const mode = footstompData.animType ?? "RANDOM";

      let selectedFrame = frameNo;
      if (mode === "RANDOM") {
        selectedFrame = Math.floor(Math.random() * (selectedFrame - 1));
      } else if (mode === "SEQUENTIAL") {
        selectedFrame = enemy.footstompFrameIndex % frameNo;
        enemy.footstompFrameIndex++;
      }

      // トラップ生成
      new FootstompTrap(
        this.scene,
        trapWorldX,
        trapWorldY,
        footstompData.footstompTexture,
        selectedFrame,
        rotationAngle,
        duration,
        footstompData.validItemId,
      );

      enemy.lastTileX = currentTileX;
      enemy.lastTileY = currentTileY;
    }
  }

  /**
   * 移動ロジック
   * @param enemy
   * @returns
   */
  private updateEnemyAI(enemy: Enemy): void {
    if (!enemy.body) return;
    const enemyData = enemy.getEnemyData();

    switch (enemyData.moveType) {
      case "MIRROR":
        this.updateMirrorMovement(enemy);
        return;
      case "RANGED":
        this.updateRangedState(enemy);
        return;
      case "CHASE_2":
        this.updateChase2State(enemy);
        break;
      case "CHASE_3":
        this.updateChase3State(enemy);
        break;
      case "CHASE_4":
        this.moveChase4(enemy);
        break;
    }

    if (enemyData.isGhost) return;

    // 壁衝突時の方向転換
    const b = enemy.body.blocked;
    const t = enemy.body.touching;

    // 壁にぶつかった瞬間の緊急ターン
    if (enemyData.moveType === "HORIZONTAL") {
      if (b.left || t.left || b.right || t.right) this.changeDirection(enemy);
    } else if (enemyData.moveType === "VERTICAL") {
      if (b.down || t.down || b.up || t.up) this.changeDirection(enemy);
    } else if (
      enemyData.moveType === "RANDOM" ||
      (enemyData.moveType === "CHASE_2" && !enemy.isChasing2) ||
      enemyData.moveType === "CHASE_3"
    ) {
      if (b.left || t.left || b.right || t.right || b.up || t.up || b.down || t.down) {
        if (enemyData.moveType === "CHASE_3" && enemy.isChasing3) {
          enemy.isChasing3 = false;

          // クールダウン設定
          const cooldown = enemyData.chaseCooldown ?? 0;
          enemy.nextSearchableTime = this.scene.time.now + cooldown;

          // 壁の反対側へ向き直す
          if (b.left || t.left) enemy.setFacingDirection(1, 0);
          else if (b.right || t.right) enemy.setFacingDirection(-1, 0);
          else if (b.up || t.up) enemy.setFacingDirection(0, 1);
          else if (b.down || t.down) enemy.setFacingDirection(0, -1);
        }
        this.changeDirection(enemy);
      }
    }
  }

  /**
   * 移動処理のエントリポイント
   */
  public changeDirection(enemy: Enemy): void {
    if (!enemy.active || !enemy.body) return;
    const enemyData = enemy.getEnemyData();

    switch (enemyData.moveType) {
      case "HORIZONTAL":
        this.moveHorizontal(enemy);
        break;
      case "VERTICAL":
        this.moveVertical(enemy);
        break;
      case "RANDOM":
        this.moveRandom(enemy);
        break;
      case "CHASE":
        this.moveChase(enemy);
        break;
      case "CHASE_2":
      case "RANGED":
        this.moveChase2(enemy);
        break;
      case "CHASE_3":
        this.moveChase3(enemy);
        break;
      case "CHASE_4":
        this.moveChase4(enemy);
        break;
    }
  }

  private moveHorizontal(enemy: Enemy): void {
    if (!enemy.body) return;
    const enemyData = enemy.getEnemyData();
    const speed = enemyData.speed ?? 50;
    const moveSteps = enemyData.moveSteps ?? 1;

    if (enemy.getData("isMovingLeft") === undefined) {
      enemy.setData("isMovingLeft", Phaser.Math.RND.pick([true, false]));
    }

    let isMovingLeft = enemy.getData("isMovingLeft");
    const b = enemy.body.blocked;
    const t = enemy.body.touching;

    if (b.left || t.left) isMovingLeft = false;
    else if (b.right || t.right) isMovingLeft = true;
    else if (Phaser.Math.RND.pick([true, false])) isMovingLeft = !isMovingLeft;

    enemy.setData("isMovingLeft", isMovingLeft);
    enemy.setVelocity(isMovingLeft ? -speed : speed, 0);
    enemy.setFlipX(!isMovingLeft);

    const nextDelay = speed > 0 ? ((moveSteps * TILE_SIZE) / speed) * 1000 + 100 : 1000;
    this.resetTimer(enemy, nextDelay);
  }

  private moveVertical(enemy: Enemy): void {
    if (!enemy.body) return;
    const enemyData = enemy.getEnemyData();
    const speed = enemyData.speed ?? 50;
    const moveSteps = enemyData.moveSteps ?? 1;

    if (enemy.getData("isMovingUp") === undefined) {
      enemy.setData("isMovingUp", Phaser.Math.RND.pick([true, false]));
    }

    let isMovingUp = enemy.getData("isMovingUp");

    const b = enemy.body.blocked;
    const t = enemy.body.touching;

    if (b.up || t.up) isMovingUp = false;
    else if (b.down || t.down) isMovingUp = true;
    else if (Phaser.Math.RND.pick([true, false])) isMovingUp = !isMovingUp;

    enemy.setData("isMovingUp", isMovingUp);
    enemy.setVelocity(0, isMovingUp ? -speed : speed);
    enemy.setFlipY(isMovingUp);

    const nextDelay = speed > 0 ? ((moveSteps * TILE_SIZE) / speed) * 1000 + 100 : 1000;
    this.resetTimer(enemy, nextDelay);
  }

  private moveRandom(enemy: Enemy): void {
    if (!enemy.body) return;
    const enemyData = enemy.getEnemyData();
    const speed = enemyData.speed ?? 0;
    const moveSteps = enemyData.moveSteps ?? 0;

    // moveSteps: 0 または speed: 0 の場合は停止しつつ、ランダムに向きを変えて視界を更新
    if (moveSteps === 0 || speed === 0) {
      enemy.setVelocity(0, 0);
      if (enemyData.animType?.startsWith("DIRECTIONAL")) {
        const randomDir = Phaser.Math.RND.pick([
          [0, 1],
          [0, -1],
          [-1, 0],
          [1, 0],
        ]);
        enemy.setFacingDirection(randomDir[0], randomDir[1]);
      }
      this.resetTimer(enemy, 1000);
      return;
    }

    const b = enemy.body.blocked;
    const t = enemy.body.touching;
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

    enemy.setVelocity(dir[0] * speed, dir[1] * speed);
    this.resetTimer(enemy, ((moveSteps * TILE_SIZE) / speed) * 1000);
  }

  /**
   * CHASE_1 の移動制御（プレイヤーの位置を常時把握して追跡）
   */
  private moveChase(enemy: Enemy, speedUp?: number): void {
    const enemyData = enemy.getEnemyData();
    const baseSpeed = enemyData.speed && enemyData.speed > 0 ? enemyData.speed : 50;
    const speed = baseSpeed * (speedUp ?? 1);
    const mainScene = this.scene as MainScene;
    const currentPlayer: Player = mainScene.getPlayer();

    if (!currentPlayer || !currentPlayer.active) {
      enemy.setVelocity(0, 0);
      return;
    }

    const diffX = currentPlayer.x - enemy.x;
    const diffY = currentPlayer.y - enemy.y;

    let moveX = Math.abs(diffX) < 4 ? 0 : Math.sign(diffX);
    let moveY = Math.abs(diffY) < 4 ? 0 : Math.sign(diffY);

    if (!enemyData.isGhost && enemy.body) {
      const blocked = enemy.body.blocked;
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
    enemy.setVelocity(moveX * speed * factor, moveY * speed * factor);
  }

  /**
   * CHASE_2 の移動制御（感知・追跡）
   */
  private moveChase2(enemy: Enemy): void {
    const enemyData = enemy.getEnemyData();
    if (enemy.isChasing2) {
      // 追跡中の場合は moveChase と同じ移動を行う
      this.moveChase(enemy, enemyData.speedUp);
      // 追跡中はタイマーを頻繁に呼び出して追跡速度を維持
      this.resetTimer(enemy, 50);
    } else {
      // 通常時はランダム移動
      this.moveRandom(enemy);
    }
  }

  /**
   * CHASE_3 の移動制御（感知・猪突猛進）
   */
  private moveChase3(enemy: Enemy): void {
    const enemyData = enemy.getEnemyData();
    if (enemy.isChasing3) {
      const baseSpeed = enemyData.speed && enemyData.speed > 0 ? enemyData.speed : 50;
      const speed = baseSpeed * (enemyData.speedUp ?? 1);

      // 感知時に固定した方向ベクトルで正確に突進
      enemy.setVelocity(enemy.chase3Direction.x * speed, enemy.chase3Direction.y * speed);

      // 突進方向に向けてアニメーションと向きを設定
      enemy.setFacingDirection(enemy.chase3Direction.x, enemy.chase3Direction.y);
      this.resetTimer(enemy, 50);
    } else {
      this.moveRandom(enemy);
    }
  }

  /**
   * CHASE_4 の移動制御（だるまさんが転んだ）
   */
  private moveChase4(enemy: Enemy): void {
    const enemyData = enemy.getEnemyData();
    const mainScene = this.scene as MainScene;
    const currentPlayer: Player = mainScene.getPlayer();

    if (!currentPlayer || !currentPlayer.active) {
      enemy.setVelocity(0, 0);
      if (enemy.anims.isPlaying) enemy.anims.pause();
      return;
    }

    // プレイヤーが敵の方向を見ている場合は追跡停止
    if (this.isPlayerLookingAtEnemy(currentPlayer, enemy)) {
      enemy.setVelocity(0, 0);

      // アニメーションが再生中であれば一時停止
      if (enemy.anims.isPlaying) {
        enemy.anims.pause();
        if (enemy.anims.currentAnim) {
          enemy.anims.setCurrentFrame(enemy.anims.currentAnim.frames[0]);
        }
      }
      return;
    }

    // 見られていない場合はアニメーションを再開
    if (enemy.anims.isPaused) {
      enemy.anims.resume();
    }

    // 通常の追尾移動
    this.moveChase(enemy, enemyData.speedUp);
  }

  /**
   * 鏡像型の移動制御
   */
  private updateMirrorMovement(enemy: Enemy): void {
    const enemyData = enemy.getEnemyData();
    const mainScene = this.scene as MainScene;
    const player = mainScene.getPlayer();
    if (!player || !player.active || !player.body) return;

    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    const speed = enemyData.speed || 100; // プレイヤーの移動に合わせる速度

    // プレイヤーの移動方向（-1, 0, 1）を取得
    const pDirX = Math.sign(playerBody.velocity.x);
    const pDirY = Math.sign(playerBody.velocity.y);

    // 反転設定の取得
    const axis = enemyData.mirrorAxis || "BOTH";

    // プレイヤーの動く方向に応じて敵の移動方向を反転決定
    let targetDirX = 0;
    let targetDirY = 0;

    if (axis === "BOTH" || axis === "HORIZONTAL_ONLY") {
      targetDirX = -pDirX; // 左右反転
    } else {
      targetDirX = pDirX;
    }

    if (axis === "BOTH" || axis === "VERTICAL_ONLY") {
      targetDirY = -pDirY; // 上下反転
    } else {
      targetDirY = pDirY;
    }

    // 敵の速度を適用
    enemy.setVelocity(targetDirX * speed, targetDirY * speed);

    // 壁などでブロックされている場合はその方向の速度をゼロにする
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    if ((targetDirX < 0 && body.blocked.left) || (targetDirX > 0 && body.blocked.right)) {
      enemy.setVelocityX(0);
    }
    if ((targetDirY < 0 && body.blocked.up) || (targetDirY > 0 && body.blocked.down)) {
      enemy.setVelocityY(0);
    }
  }

  /**
   * 遠隔攻撃タイプの状態更新
   */
  private updateRangedState(enemy: Enemy): void {
    if (!enemy.body) return;
    const enemyData = enemy.getEnemyData();
    const mainScene = this.scene as MainScene;
    const player = mainScene.getPlayer();
    if (!player || !player.active) return;

    const rData = enemyData.rangedData;
    const maxDistance = (enemyData.chaseDistance ?? 6) * TILE_SIZE;
    const prepareTime = rData?.prepareTime ?? 1000;
    const cooldown = rData?.cooldown ?? 3000;

    // 溜め中・攻撃中は完全に足止め
    if (enemy.rangedState === "PREPARE" || enemy.rangedState === "ATTACK") {
      enemy.setVelocity(0, 0);
      return;
    }

    // プレイヤーの発見判定
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
    const canSeePlayer = dist <= maxDistance && !this.isLineOfSightBlocked(enemy, player);
    if (canSeePlayer && this.scene.time.now - enemy.lastRangedAttackTime > cooldown) {
      // 攻撃シーケンス開始
      this.startRangedAttackSequence(enemy, player, prepareTime, cooldown);
    } else if (enemy.rangedState === "IDLE") {
      const speed = enemyData.speed ?? 0;
      if (speed === 0) {
        // 固定敵
        enemy.setVelocity(0, 0);
      } else if (enemy.body.velocity.x === 0 && enemy.body.velocity.y === 0) {
        // 移動敵
        this.changeDirection(enemy);
      }
    }
  }

  /**
   * 遠隔攻撃開始準備
   */
  private startRangedAttackSequence(enemy: Enemy, player: Player, prepareTime: number, cooldown: number): void {
    enemy.rangedState = "PREPARE";
    enemy.setVelocity(0, 0);

    // プレイヤーの方向へ向き直る
    const dirX = player.x - enemy.x;
    const dirY = player.y - enemy.y;
    enemy.setFacingDirection(dirX, dirY);

    // 予兆演出
    enemy.setTint(0xff8888);

    // 溜め時間経過後に攻撃発射
    this.scene.time.delayedCall(prepareTime, () => {
      if (!enemy.active || !enemy.scene) return;
      // 予兆演出の解除
      enemy.clearTint();
      enemy.rangedState = "ATTACK";

      // 弾の発射
      this.executeRangedShot(enemy, player, () => {
        // 撃ち終わったらクールダウンへ移行
        enemy.rangedState = "COOLDOWN";
        enemy.lastRangedAttackTime = this.scene.time.now;

        // クールタイム終了後にIDLEに戻って移動再開
        this.scene.time.delayedCall(cooldown, () => {
          if (enemy.active || !enemy.scene) {
            enemy.rangedState = "IDLE";
            this.changeDirection(enemy);
          }
        });
      });
    });
  }

  /**
   * 弾を発射
   */
  private executeRangedShot(enemy: Enemy, player: Player, onComplete: () => void): void {
    const enemyData = enemy.getEnemyData();
    const mainScene = this.scene as MainScene;
    const rData = enemyData.rangedData;

    const bulletTexture = rData?.bulletTexture || ("bullet-default" as AssetKey);
    const speed = rData?.bulletSpeed ?? 200;
    const shotCount = rData?.shotCount ?? 1;
    const shotInterval = rData?.shotInterval ?? 150;

    let shotsFired = 0;

    // 1発発射する共通処理関数
    const fireSingleBullet = () => {
      if (!enemy.active || !player.active) return false;

      // 発射時点のプレイヤー位置に向けてベクトル計算
      const dirX = player.x - enemy.x;
      const dirY = player.y - enemy.y;

      // 弾インスタンス生成時
      const bullet = new EnemyBullet(this.scene, enemy.x, enemy.y, bulletTexture, dirX, dirY, speed, rData?.bulletAnim);

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
    if (!fireSingleBullet() || shotsFired >= shotCount) {
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
  private updateChase2State(enemy: Enemy): void {
    const enemyData = enemy.getEnemyData();
    const mainScene = this.scene as MainScene;
    const player: Player = mainScene.getPlayer();
    if (!player || !player.active) {
      if (enemy.isChasing2) {
        enemy.isChasing2 = false;
        this.changeDirection(enemy);
      }
      return;
    }

    const maxDistance = (enemyData.chaseDistance ?? 5) * TILE_SIZE;
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);

    if (enemy.isChasing2) {
      // 追跡中：距離が一定以上離れたらランダム移動に戻る
      if (dist > maxDistance) {
        enemy.isChasing2 = false;
        this.changeDirection(enemy);
      }
    } else {
      // ランダム移動中：一定距離内 かつ 進行方向の視界内にプレイヤーがいるか確認
      if (dist <= maxDistance && !this.isLineOfSightBlocked(enemy, player)) {
        enemy.isChasing2 = true;
        this.changeDirection(enemy);
      }
    }
  }

  /**
   * CHASE_3用の状態監視
   */
  private updateChase3State(enemy: Enemy): void {
    const enemyData = enemy.getEnemyData();
    const mainScene = this.scene as MainScene;
    const player: Player = mainScene.getPlayer();

    if (!player || !player.active) {
      if (enemy.isChasing3) {
        enemy.isChasing3 = false;
        this.changeDirection(enemy);
      }
      return;
    }

    if (this.scene.time.now < enemy.nextSearchableTime) return;

    const maxDistance = (enemyData.chaseDistance ?? 5) * TILE_SIZE;
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);

    if (!enemy.isChasing3) {
      if (dist <= maxDistance && !this.isLineOfSightBlocked(enemy, player)) {
        enemy.isChasing3 = true;

        // 敵からプレイヤーへ向かう単位ベクトルを算出
        const diffX = player.x - enemy.x;
        const diffY = player.y - enemy.y;
        const len = Math.hypot(diffX, diffY);

        if (len > 0) {
          enemy.chase3Direction = { x: diffX / len, y: diffY / len };
        } else {
          enemy.chase3Direction = { x: 0, y: 1 };
        }

        this.changeDirection(enemy);
      }
    }
  }

  /**
   * ゴースト制御
   * @param enemy
   * @returns
   */
  private handleGhostBoundaries(enemy: Enemy): void {
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const minX = TILE_SIZE + enemy.width / 2;
    const minY = TILE_SIZE + enemy.height / 2;

    const mapWidth = this.scene.physics.world.bounds.width;
    const mapHeight = this.scene.physics.world.bounds.height;

    const maxX = mapWidth - TILE_SIZE - enemy.width / 2;
    const maxY = mapHeight - TILE_SIZE - enemy.height / 2;

    // 範囲外に出そうになっているか判定
    const isAtBoundaryX = enemy.x <= minX || enemy.x >= maxX;
    const isAtBoundaryY = enemy.y <= minY || enemy.y >= maxY;

    enemy.x = Phaser.Math.Clamp(enemy.x, minX, maxX);
    enemy.y = Phaser.Math.Clamp(enemy.y, minY, maxY);

    // 外枠に到達していて、かつその方向へ進もうとしている場合は方向転換を実行
    if ((isAtBoundaryX && Math.abs(body.velocity.x) > 0) || (isAtBoundaryY && Math.abs(body.velocity.y) > 0)) {
      this.changeDirection(enemy);
    }
  }

  /**
   * プレイヤーとの距離に応じて透明度を更新
   */
  private updateStealthState(enemy: Enemy): void {
    const enemyData = enemy.getEnemyData();
    if (!enemyData.isStealth) return;

    const mainScene = this.scene as MainScene;
    const currentPlayer: Player = mainScene.getPlayer();
    if (!currentPlayer) return;

    // プレイヤーと敵の距離を計算
    const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, currentPlayer.x, currentPlayer.y);
    // 視認距離
    const detectDist = (enemyData.detectDistance ?? 3) * TILE_SIZE;

    if (distance <= detectDist) {
      // 透明度
      const alpha = Phaser.Math.Clamp(1 - distance / detectDist, 0.2, 1.0);
      enemy.setAlpha(alpha);
      enemy.setVisible(true);
    } else {
      enemy.setAlpha(0);
      enemy.setVisible(false); // 完全に隠す場合
    }
  }

  /**
   * 視界判定（DIRECTIONAL の場合は内積判定）
   */
  public isLineOfSightBlocked(enemy: Enemy, player: Player): boolean {
    const enemyData = enemy.getEnemyData();
    const isDirectional = enemyData.animType?.startsWith("DIRECTIONAL");

    if (isDirectional) {
      const facing = enemy.getCurrentFacing();
      const toPlayerX = player.x - enemy.x;
      const toPlayerY = player.y - enemy.y;
      const dotProduct = toPlayerX * facing.x + toPlayerY * facing.y;

      if (dotProduct <= 0) return true;
    }

    const mainScene = this.scene as MainScene;
    const ray = new Phaser.Geom.Line(enemy.x, enemy.y, player.x, player.y);

    // 視線チェックの対象とするグループ一覧を取得
    const obstacleGroups = [
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
        if (group === mainScene.getDoors() && child.getData("isLocked") === false) continue;

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
   * プレイヤーが敵の方向を見ているかを判定する（だるまさんがころんだ判定）
   */
  private isPlayerLookingAtEnemy(player: Player, enemy: Enemy): boolean {
    // プレイヤーから見た敵の方向を計算
    const toEnemyX = enemy.x - player.x;
    const toEnemyY = enemy.y - player.y;

    const len = Math.hypot(toEnemyX, toEnemyY);
    if (len === 0) return true; // プレイヤーと重なっている場合は見ている扱い

    // プレイヤーから敵へ向かう単位ベクトル
    const dirToEnemyX = toEnemyX / len;
    const dirToEnemyY = toEnemyY / len;

    // プレイヤーの視界ベクトルを取得
    const playerFacing = player.getFacingVector();

    // 内積を計算
    const dot = dirToEnemyX * playerFacing.x + dirToEnemyY * playerFacing.y;

    // 正面90度
    return dot > 0.707;
  }

  private resetTimer(enemy: Enemy, delay: number): void {
    if (enemy.moveEvent) {
      enemy.moveEvent.reset({
        delay,
        callback: () => this.changeDirection(enemy),
        loop: true,
      });
    }
  }

  public getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  public destroy(): void {
    const enemies = this.group.getChildren() as Enemy[];
    enemies.forEach((enemy) => enemy.cleanup());
    this.group.clear(true, true);
  }
}
