import * as Phaser from "phaser";
import { TILE_SIZE } from "@/game-core/types";

export class StoneManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * TILE_CATEGORIESがSTONE（石・氷・ブロック）のオブジェクトを押した時の移動ロジック
   */
  public handleStonePush(
    pusher: Phaser.Physics.Arcade.Sprite,
    stone: Phaser.Physics.Arcade.Sprite,
    enemies: Phaser.Physics.Arcade.Group,
    walls: Phaser.Physics.Arcade.StaticGroup,
    breakableWalls: Phaser.Physics.Arcade.StaticGroup,
    doors: Phaser.Physics.Arcade.StaticGroup,
    movableStones: Phaser.Physics.Arcade.Group,
  ) {
    if (stone.getData("isMoving") || stone.getData("isDisappearing")) return;

    // 向きの決定
    const dx = stone.x - pusher.x;
    const dy = stone.y - pusher.y;
    let moveX = 0;
    let moveY = 0;

    if (Math.abs(dx) > Math.abs(dy)) {
      moveX = dx > 0 ? TILE_SIZE : -TILE_SIZE;
    } else {
      moveY = dy > 0 ? TILE_SIZE : -TILE_SIZE;
    }

    // 進行方向に敵がいたら動かさない
    if (this.isEnemyAhead(stone, moveX, moveY, enemies)) return;

    // 移動先の最終地点を計算
    const isIce = stone.getData("element") === "ICE";
    const targetPos = this.calculateTargetPosition(
      stone,
      moveX,
      moveY,
      isIce,
      enemies,
      walls,
      breakableWalls,
      doors,
      movableStones,
    );

    // 移動先が変わらない場合は処理終了
    if (targetPos.x === stone.x && targetPos.y === stone.y) {
      if (targetPos.hitObject) {
        // 移動方向の正規化 (-1, 0, 1)
        const dirX = Math.sign(moveX);
        const dirY = Math.sign(moveY);

        if (movableStones && targetPos.hitObject.getData("element") === "BLOCK") {
          this.handleStoneToStoneCollision(
            stone,
            targetPos.hitObject as Phaser.Physics.Arcade.Sprite,
            movableStones,
            dirX,
            dirY,
          );
        } else if (walls && targetPos.hitObject.getData("element") === "WALL") {
          this.handleStoneToWallCollision(stone, targetPos.hitObject, movableStones, walls, dirX, dirY);
        }
      }
      return;
    }

    if (!this.canPushStone(moveX, moveY, stone)) return;

    stone.setData("isMoving", true);

    this.moveStoneTween(stone, targetPos, isIce, true, movableStones, walls);
  }

  /**
   * 攻撃によってSTONEを飛ばす
   */
  public moveStoneByAttack(
    stone: Phaser.Physics.Arcade.Sprite,
    direction: { x: number; y: number },
    enemies: Phaser.Physics.Arcade.Group,
    walls: Phaser.Physics.Arcade.StaticGroup,
    breakableWalls: Phaser.Physics.Arcade.StaticGroup,
    doors: Phaser.Physics.Arcade.StaticGroup,
    movableStones: Phaser.Physics.Arcade.Group,
  ) {
    if (stone.getData("isMoving") || stone.getData("isDisappearing")) return;

    const moveX = direction.x * TILE_SIZE;
    const moveY = direction.y * TILE_SIZE;

    if (this.isEnemyAhead(stone, moveX, moveY, enemies)) return;

    const isIce = stone.getData("element") === "ICE";
    const targetPos = this.calculateTargetPosition(
      stone,
      moveX,
      moveY,
      isIce,
      enemies,
      walls,
      breakableWalls,
      doors,
      movableStones,
    );

    if (targetPos.x === stone.x && targetPos.y === stone.y && !targetPos.hitObject) {
      return;
    }

    if (!this.canPushStone(moveX, moveY, stone)) return;

    stone.setData("isMoving", true);

    this.moveStoneTween(stone, targetPos, isIce, true, movableStones, walls);
  }

  /**
   * 色ブロック✕色ブロックの衝突ハンドラ
   */
  public handleStoneToStoneCollision = (
    stone1: Phaser.Physics.Arcade.Sprite,
    stone2: Phaser.Physics.Arcade.Sprite,
    movableStones?: Phaser.Physics.Arcade.Group,
    dirX: number = 0,
    dirY: number = 0,
  ) => {
    if (stone1.getData("color") == "NONE" || stone2.getData("color") == "NONE") return;

    const isBlock1 = stone1.getData("element") === "BLOCK";
    const isBlock2 = stone2.getData("element") === "BLOCK";
    const color1 = stone1.getData("color");
    const color2 = stone2.getData("color");

    if (
      isBlock1 &&
      isBlock2 &&
      color1 &&
      color1 === color2 &&
      !stone1.getData("isDisappearing") &&
      !stone2.getData("isDisappearing")
    ) {
      // 押した方向へずらしながら消滅させる
      this.disappearObject(stone1, movableStones, dirX, dirY, true);
      this.disappearObject(stone2, movableStones, dirX, dirY, false);
    }
  };

  /**
   * 色ブロック✕色付き壁の衝突ハンドラ
   */
  public handleStoneToWallCollision = (
    stone: Phaser.Physics.Arcade.Sprite,
    wall: Phaser.GameObjects.GameObject,
    movableStones?: Phaser.Physics.Arcade.Group,
    wallsGroup?: Phaser.Physics.Arcade.StaticGroup,
    dirX: number = 0,
    dirY: number = 0,
  ) => {
    if (stone.getData("color") == "NONE" || wall.getData("color") == "NONE") return;

    const isBlock = stone.getData("element") === "BLOCK";
    const isColorWall = wall.getData("element") === "WALL";
    const stoneColor = stone.getData("color");
    const wallColor = wall.getData("color");

    if (
      isBlock &&
      isColorWall &&
      stoneColor &&
      stoneColor === wallColor &&
      !stone.getData("isDisappearing") &&
      !wall.getData("isDisappearing")
    ) {
      // 押した方向へずらしながら消滅させる
      this.disappearObject(stone, movableStones, dirX, dirY, true);
      this.disappearObject(wall, wallsGroup, dirX, dirY, false);
    }
  };

  /**
   * 消滅処理
   */
  public disappearObject(
    target: Phaser.GameObjects.GameObject,
    group?: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup,
    dirX: number = 0,
    dirY: number = 0,
    shouldOffset: boolean = false,
  ) {
    if (target.getData("isDisappearing")) return;
    target.setData("isDisappearing", true);

    // 進行中のTween移動があれば強制終了
    this.scene.tweens.killTweensOf(target);

    // 物理判定をオフにして連鎖・誤判定を防止
    if (target.body instanceof Phaser.Physics.Arcade.Body || target.body instanceof Phaser.Physics.Arcade.StaticBody) {
      target.body.enable = false;
    }

    // 押し込む量
    const PUSH_OFFSET = TILE_SIZE * 0.8;
    const sprite = target as Phaser.Physics.Arcade.Sprite;

    // 押した本人のみ座標を変化させる
    const targetX = shouldOffset ? sprite.x + dirX * PUSH_OFFSET : sprite.x;
    const targetY = shouldOffset ? sprite.y + dirY * PUSH_OFFSET : sprite.y;

    this.scene.tweens.add({
      targets: target,
      x: targetX,
      y: targetY,
      alpha: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 500,
      ease: "Cubic.easeOut", // 押されてスッと吸い込まれるようなイージング
      onComplete: () => {
        if (group) {
          group.remove(target, true, true);
        } else {
          target.destroy();
        }
      },
    });
  }

  /**
   * 敵と石が進行方向で衝突した時の処理
   */
  public checkAndStopStoneOnEnemyCollision(enemy: Phaser.Physics.Arcade.Sprite, stone: Phaser.Physics.Arcade.Sprite) {
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
   * 壊れる石・氷を破壊する処理
   */
  public breakStone(
    stone: Phaser.Physics.Arcade.Sprite,
    element: "STONE" | "ICE",
    movableStones: Phaser.Physics.Arcade.Group,
  ) {
    if (stone.body instanceof Phaser.Physics.Arcade.Body) {
      stone.body.enable = false;
    }
    // 破壊するときの演出
    const flashColor = element === "ICE" ? 0x00ffff : 0xffa500;
    stone.setTint(flashColor);

    this.scene.tweens.add({
      targets: stone,
      alpha: 0,
      scale: 0.5,
      duration: 100,
      onComplete: () => {
        movableStones.remove(stone, true, true);
      },
    });
  }

  /**
   * 滑っている石を敵との衝突時に強制ストップ
   */
  private stopStoneMovement(stone: Phaser.Physics.Arcade.Sprite) {
    // 実行中の移動Tweenを強制終了
    this.scene.tweens.killTweensOf(stone);
    // 中途半端な座標で止まらないよう、グリッドの中心にスナップ
    const snappedX = Math.floor(stone.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    const snappedY = Math.floor(stone.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    stone.setPosition(snappedX, snappedY);
  }

  /**
   * 押そうとした1マス先に敵がいるか判定
   */
  private isEnemyAhead(
    stone: Phaser.Physics.Arcade.Sprite,
    moveX: number,
    moveY: number,
    enemies: Phaser.Physics.Arcade.Group,
  ): boolean {
    const nextGridX = stone.x + moveX;
    const nextGridY = stone.y + moveY;

    return enemies.getChildren().some((e) => {
      const enemy = e as Phaser.Physics.Arcade.Sprite;
      return Phaser.Math.Distance.Between(enemy.x, enemy.y, nextGridX, nextGridY) < 16;
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
    enemies: Phaser.Physics.Arcade.Group,
    walls: Phaser.Physics.Arcade.StaticGroup,
    breakableWalls: Phaser.Physics.Arcade.StaticGroup,
    doors: Phaser.Physics.Arcade.StaticGroup,
    movableStones: Phaser.Physics.Arcade.Group,
  ): { x: number; y: number; hitObject?: Phaser.GameObjects.GameObject } {
    let currX = stone.x;
    let currY = stone.y;

    const TOLERANCE = 8; // グリッド中心からの許容誤差

    // 指定座標にあるオブジェクトを探すヘルパー
    const findObjectAt = (
      group: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup | undefined,
      targetX: number,
      targetY: number,
    ) => {
      if (!group) return undefined;
      return group.getChildren().find((obj: any) => {
        if (obj === stone) return false;
        if (obj.getData && obj.getData("isDisappearing")) return false;
        return Phaser.Math.Distance.Between(obj.x, obj.y, targetX, targetY) < TOLERANCE;
      });
    };

    // 現在地の1マス先にオブジェクトがすでにあるか確認
    const immediateNextX = currX + moveX;
    const immediateNextY = currY + moveY;

    const adjacentStone = findObjectAt(movableStones, immediateNextX, immediateNextY);
    const adjacentWall = findObjectAt(walls, immediateNextX, immediateNextY);

    if (adjacentStone || adjacentWall) {
      // 既に目の前に石や壁がある状態で押し込んだ場合
      return {
        x: currX,
        y: currY,
        hitObject: adjacentStone || adjacentWall,
      };
    }

    // 目の前が空いている場合
    while (true) {
      const nextX = currX + moveX;
      const nextY = currY + moveY;

      // 移動先の障害物をチェック
      const nextStone = findObjectAt(movableStones, nextX, nextY);
      const nextWall = findObjectAt(walls, nextX, nextY);
      const nextEnemy = findObjectAt(enemies, nextX, nextY);
      const nextBreakable = findObjectAt(breakableWalls, nextX, nextY);
      const nextDoor = doors
        ?.getChildren()
        .find((d: any) => d.body?.enable && Phaser.Math.Distance.Between(d.x, d.y, nextX, nextY) < TOLERANCE);

      // 障害物があれば、それ以上進めないので手前でループ終了
      if (nextStone || nextWall || nextEnemy || nextBreakable || nextDoor) {
        break;
      }

      // 障害物がなければ 1マス進める
      currX = nextX;
      currY = nextY;

      // 氷でないなら1マス進んで終了
      if (!isIce) {
        break;
      }

      // 画面外チェック（氷用）
      if (
        currX < 0 ||
        currX > this.scene.physics.world.bounds.width ||
        currY < 0 ||
        currY > this.scene.physics.world.bounds.height
      ) {
        break;
      }
    }

    return { x: currX, y: currY, hitObject: undefined };
  }

  /**
   * 石のtween移動を制御
   */
  private moveStoneTween(
    stone: Phaser.Physics.Arcade.Sprite,
    targetResult: { x: number; y: number; hitObject?: Phaser.GameObjects.GameObject },
    isIce: boolean,
    isAttack: boolean = false,
    movableStones?: Phaser.Physics.Arcade.Group,
    walls?: Phaser.Physics.Arcade.StaticGroup,
  ) {
    const { x: targetX, y: targetY, hitObject } = targetResult;
    const distance = Phaser.Math.Distance.Between(stone.x, stone.y, targetX, targetY);

    if (distance === 0) {
      stone.setData("isMoving", false);
      return;
    }

    let duration = (distance / TILE_SIZE) * 300;
    if (isAttack) {
      duration = isIce ? (distance / TILE_SIZE) * 120 : 120;
    }

    // すでに動いているTweenがあれば安全に停止
    this.scene.tweens.killTweensOf(stone);

    stone.setData("targetX", targetX);
    stone.setData("targetY", targetY);

    this.scene.tweens.add({
      targets: stone,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: isIce || isAttack ? "Linear" : "Cubic.easeOut",
      onUpdate: () => {
        if (stone.body) (stone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
      },
      onComplete: () => {
        if (stone.getData("isDisappearing")) return;
        this.clearStoneData(stone);
        this.decrementStoneCount(stone);

        // 移動完了時に衝突対象との消滅判定をロジックで直接実行
        if (hitObject) {
          if (movableStones && hitObject.getData("element") === "BLOCK") {
            this.handleStoneToStoneCollision(stone, hitObject as Phaser.Physics.Arcade.Sprite, movableStones);
          } else if (walls && hitObject.getData("element") === "WALL") {
            this.handleStoneToWallCollision(stone, hitObject, movableStones, walls);
          }
        }
      },
    });
  }

  /**
   * 移動可能か判定
   */
  private canPushStone(moveX: number, moveY: number, stone: Phaser.Physics.Arcade.Sprite): boolean {
    // 移動回数制限のチェック
    const remainingCount = stone.getData("remainingCount");
    if (remainingCount !== undefined && remainingCount <= 0) {
      return false;
    }

    // 方向性のチェック
    const allowed: string = stone.getData("allowedDirection") || "ALL";
    if (allowed.includes("ALL")) return true;
    if (moveX > 0 && allowed === "RIGHT") return true;
    if (moveX < 0 && allowed === "LEFT") return true;
    if (moveY > 0 && allowed === "DOWN") return true;
    if (moveY < 0 && allowed === "UP") return true;
    if (allowed.includes("HORIZONTAL") && moveY === 0) return true;
    if (allowed.includes("VERTICAL") && moveX === 0) return true;

    return false;
  }

  /**
   * 移動完了時にカウントを減らし、必要に応じてスプライト表示を変更する
   */
  private decrementStoneCount(stone: Phaser.Physics.Arcade.Sprite) {
    const remainingCount = stone.getData("remainingCount");
    if (remainingCount === undefined) return;

    const newCount = Math.max(0, remainingCount - 1);
    stone.setData("remainingCount", newCount);

    const maxCount = stone.getData("maxCount") || newCount;

    const frameIndex = maxCount - newCount;
    console.log("maxCount:", maxCount);
    console.log("newCount:", newCount);
    console.log("frameIndex:", frameIndex);
    stone.setFrame(frameIndex);

    // カウント0になったら動かない壁にする
    if (newCount === 0 && stone.body instanceof Phaser.Physics.Arcade.Body) {
      stone.body.setImmovable(true);
    }
  }

  /**
   * クリア処理
   */
  private clearStoneData(stone: Phaser.Physics.Arcade.Sprite) {
    stone.setData("isMoving", false);
    stone.setData("targetX", undefined);
    stone.setData("targetY", undefined);
    if (stone.body) (stone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
  }
}
