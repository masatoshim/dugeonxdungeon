import * as Phaser from "phaser";
import { Player } from "@/game-core/entities/Player";

export class StoneManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 石または氷を押した時の移動ロジック
   */
  public handleStonePush(
    player: Player,
    stone: Phaser.Physics.Arcade.Sprite,
    enemies: Phaser.Physics.Arcade.Group,
    walls: Phaser.Physics.Arcade.StaticGroup,
    breakableWalls: Phaser.Physics.Arcade.StaticGroup,
    doors: Phaser.Physics.Arcade.StaticGroup,
    movableStones: Phaser.Physics.Arcade.Group,
  ) {
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

    if (targetPos.x === stone.x && targetPos.y === stone.y) return;

    this.moveStoneTween(stone, targetPos, isIce);
  }

  /**
   * 攻撃によって石・氷を飛ばす
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
    if (stone.getData("isMoving")) return;

    const moveX = direction.x * 32;
    const moveY = direction.y * 32;

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

    if (targetPos.x === stone.x && targetPos.y === stone.y) return;

    this.moveStoneTween(stone, targetPos, isIce, true);
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
    const snappedX = Math.floor(stone.x / 32) * 32 + 16;
    const snappedY = Math.floor(stone.y / 32) * 32 + 16;
    stone.setPosition(snappedX, snappedY);
  }

  private isEnemyAhead(
    stone: Phaser.Physics.Arcade.Sprite,
    moveX: number,
    moveY: number,
    enemies: Phaser.Physics.Arcade.Group,
  ): boolean {
    // 押そうとした1マス先に敵がいるかチェック
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
  ): { x: number; y: number } {
    let currX = stone.x;
    let currY = stone.y;

    while (true) {
      const nextX = currX + moveX;
      const nextY = currY + moveY;

      // 移動先のマスに敵がいるかチェック
      const isEnemyInNextGrid = enemies.getChildren().some((e) => {
        const enemy = e as Phaser.Physics.Arcade.Sprite;
        return Phaser.Math.Distance.Between(enemy.x, enemy.y, nextX, nextY) < 16;
      });

      // 移動先が障害物または敵でブロックされているかチェック
      const isBlocked =
        isEnemyInNextGrid ||
        walls.getChildren().some((w) => (w as any).getBounds().contains(nextX, nextY)) ||
        breakableWalls.getChildren().some((w) => (w as any).getBounds().contains(nextX, nextY)) ||
        doors.getChildren().some((d) => (d as any).body.enable && (d as any).getBounds().contains(nextX, nextY)) ||
        movableStones.getChildren().some((s) => s !== stone && (s as any).getBounds().contains(nextX, nextY));

      if (isBlocked) break;

      // 座標を更新
      currX = nextX;
      currY = nextY;

      // 通常の石の場合は1マス進んで終了
      if (!isIce) break;

      // 無限ループ防止（マップ範囲外チェック）
      if (
        currX < 0 ||
        currX > this.scene.physics.world.bounds.width ||
        currY < 0 ||
        currY > this.scene.physics.world.bounds.height
      )
        break;
    }
    return { x: currX, y: currY };
  }

  /**
   * 石のtween移動を制御
   */
  private moveStoneTween(
    stone: Phaser.Physics.Arcade.Sprite,
    targetPos: { x: number; y: number },
    isIce: boolean,
    isAttack: boolean = false,
  ) {
    const distance = Phaser.Math.Distance.Between(stone.x, stone.y, targetPos.x, targetPos.y);
    let duration = (distance / 32) * 300;
    if (isAttack) {
      duration = isIce ? (distance / 32) * 120 : 120;
    }

    stone.setData("isMoving", true);
    stone.setData("targetX", targetPos.x);
    stone.setData("targetY", targetPos.y);

    this.scene.tweens.add({
      targets: stone,
      x: targetPos.x,
      y: targetPos.y,
      duration: duration,
      ease: isIce || isAttack ? "Linear" : "Cubic.easeOut",
      onUpdate: () => {
        if (stone.body) (stone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
      },
      onComplete: () => {
        this.clearStoneData(stone);
      },
      onKill: () => {
        this.clearStoneData(stone);
      },
    });
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
