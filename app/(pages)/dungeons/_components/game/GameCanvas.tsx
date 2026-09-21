"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { MainScene } from "@/game-core/scenes/main/MainScene";
import { GAME_EVENTS, MapData } from "@/game-core/types";

interface GameCanvasProps {
  mapData: MapData;
  timeLimit: number;
  onClear?: (score: number, timeLeft: number) => void;
  onGameOver?: (score: number, timeLeft: number) => void;
  onInterrupt?: (score: number, timeLeft: number) => void;
  requestInterruptRef?: React.RefObject<(() => void) | null>;
  requestZoomRef?: React.RefObject<((zoomIn: boolean) => void) | null>;
  requestPauseRef?: React.RefObject<((pause: boolean) => void) | null>;
  requestTouchMoveRef?: React.RefObject<((dir: { x: number; y: number }) => void) | null>;
  requestTouchActionRef?: React.RefObject<(() => void) | null>;
  requestTouchReleaseRef?: React.RefObject<(() => void) | null>;
}

export default function GameCanvas({
  mapData,
  timeLimit,
  onClear,
  onGameOver,
  onInterrupt,
  requestInterruptRef,
  requestZoomRef,
  requestPauseRef,
  requestTouchMoveRef,
  requestTouchActionRef,
  requestTouchReleaseRef,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserRef = useRef<Phaser.Game | null>(null);
  const timerTextRef = useRef<HTMLSpanElement>(null);

  // コールバック参照の保持
  const onClearRef = useRef(onClear);
  const onGameOverRef = useRef(onGameOver);
  const onInterruptRef = useRef(onInterrupt);

  // 共通のタッチ/スワイプ状態管理用Ref
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const pointerDownTimeRef = useRef(0);
  const isSwipingRef = useRef(false);
  const SWIPE_THRESHOLD = 25;

  useEffect(() => {
    onClearRef.current = onClear;
    onGameOverRef.current = onGameOver;
  }, [onClear, onGameOver]);

  useEffect(() => {
    onInterruptRef.current = onInterrupt;
  }, [onInterrupt]);

  // ズーム操作用のRefバインド
  useEffect(() => {
    if (requestZoomRef) {
      requestZoomRef.current = (zoomIn: boolean) => {
        if (!phaserRef.current) return;
        const scene = phaserRef.current.scene.getScene("MainScene");
        if (!scene) return;

        const camera = scene.cameras.main;
        const MIN_ZOOM = 0.5;
        const MAX_ZOOM = 2.5;
        const zoomFactor = zoomIn ? 1.15 : 0.85;
        const newZoom = Phaser.Math.Clamp(camera.zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
        camera.setZoom(newZoom);
      };
    }
    return () => {
      if (requestZoomRef) {
        requestZoomRef.current = null;
      }
    };
  }, [requestZoomRef]);

  // ポーズ操作用のRefバインド
  useEffect(() => {
    if (requestPauseRef) {
      requestPauseRef.current = (pause: boolean) => {
        if (!phaserRef.current) return;
        const scene = phaserRef.current.scene.getScene("MainScene") as MainScene;
        if (!scene) return;

        if (pause) {
          scene.scene.pause();
        } else {
          scene.scene.resume();
        }
      };
    }
    return () => {
      if (requestPauseRef) {
        requestPauseRef.current = null;
      }
    };
  }, [requestPauseRef]);

  // 中断リクエスト用のRefバインド
  useEffect(() => {
    if (requestInterruptRef) {
      requestInterruptRef.current = () => {
        if (!phaserRef.current) return;
        phaserRef.current.events.emit(GAME_EVENTS.REQUEST_INTERRUPT);
      };
    }
    return () => {
      if (requestInterruptRef) {
        requestInterruptRef.current = null;
      }
    };
  }, [requestInterruptRef]);

  // Phaserゲーム本体の初期化
  useEffect(() => {
    // 既存のインスタンスがあれば破棄
    if (phaserRef.current) {
      phaserRef.current.destroy(true);
      phaserRef.current = null;
    }

    // DOMコンテナの中身を完全にクリア
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    if (!containerRef.current) return;

    // Phaser の設定
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: "arcade",
        arcade: { debug: false }, // Todo: 当たり判定表示.開発時はtrueに
      },
      scene: [MainScene],
    };

    const game = new Phaser.Game(config);

    game.events.once(Phaser.Core.Events.READY, () => {
      const scene = game.scene.getScene("MainScene") as MainScene;
      if (!scene) return;

      const camera = scene.cameras.main;
      const MIN_ZOOM = 0.5;
      const MAX_ZOOM = 2.5;

      // Phaser側でも入力を監視して確実にキャラクターへ伝える
      scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointerDownPosRef.current = { x: pointer.x, y: pointer.y };
        pointerDownTimeRef.current = performance.now();
        isSwipingRef.current = false;
      });

      scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
        if (!pointer.isDown) return;
        const player = scene.getPlayer?.();
        if (!player) return;

        const dx = pointer.x - pointerDownPosRef.current.x;
        const dy = pointer.y - pointerDownPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > SWIPE_THRESHOLD) {
          isSwipingRef.current = true;

          let dirX = 0;
          let dirY = 0;

          if (Math.abs(dx) > SWIPE_THRESHOLD) {
            dirX = dx > 0 ? 1 : -1;
          }
          if (Math.abs(dy) > SWIPE_THRESHOLD) {
            dirY = dy > 0 ? 1 : -1;
          }

          player.setTouchDirection({ x: dirX, y: dirY });
        }
      });

      scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        const player = scene.getPlayer?.();
        const duration = performance.now() - pointerDownTimeRef.current;
        const dx = pointer.x - pointerDownPosRef.current.x;
        const dy = pointer.y - pointerDownPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // タップ（攻撃）判定
        if (distance < SWIPE_THRESHOLD && duration < 300 && !isSwipingRef.current) {
          if (player && typeof (player as any).triggerAttack === "function") {
            (player as any).triggerAttack();
          }
        }

        // 移動停止
        if (player && typeof (player as any).setTouchDirection === "function") {
          player.setTouchDirection({ x: 0, y: 0 });
        }
      });

      // マウスホイールによるズーム
      scene.input.on(
        "wheel",
        (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, deltaY: number) => {
          const zoomFactor = deltaY < 0 ? 1.1 : 0.9;
          const newZoom = Phaser.Math.Clamp(camera.zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
          camera.setZoom(newZoom);
        },
      );

      // タッチデバイスでのピンチイン・ピンチアウト
      let initialPinchDistance = 0;
      let initialZoom = 1;

      scene.input.on("pointerdown", () => {
        if (scene.input.pointer1.isDown && scene.input.pointer2?.isDown) {
          initialPinchDistance = Phaser.Math.Distance.Between(
            scene.input.pointer1.x,
            scene.input.pointer1.y,
            scene.input.pointer2.x,
            scene.input.pointer2.y,
          );
          initialZoom = camera.zoom;
        }
      });

      scene.input.on("pointermove", () => {
        if (scene.input.pointer1.isDown && scene.input.pointer2?.isDown && initialPinchDistance > 0) {
          const currentDistance = Phaser.Math.Distance.Between(
            scene.input.pointer1.x,
            scene.input.pointer1.y,
            scene.input.pointer2.x,
            scene.input.pointer2.y,
          );
          const factor = currentDistance / initialPinchDistance;
          const newZoom = Phaser.Math.Clamp(initialZoom * factor, MIN_ZOOM, MAX_ZOOM);
          camera.setZoom(newZoom);
        }
      });

      scene.input.on("pointerup", () => {
        if (!scene.input.pointer1.isDown || !scene.input.pointer2?.isDown) {
          initialPinchDistance = 0;
        }
      });
    });

    // イベントリスナーの登録
    game.events.on(GAME_EVENTS.GAME_CLEAR, (data: { score: number; timeLeft: number }) => {
      onClearRef.current?.(data.score, data.timeLeft);
    });
    game.events.on(GAME_EVENTS.GAME_OVER, (data: { score: number; timeLeft: number }) => {
      onGameOverRef.current?.(data.score, data.timeLeft);
    });
    game.events.on(GAME_EVENTS.TIME_OVER, (data: { score: number; timeLeft: number }) => {
      onGameOverRef.current?.(data.score, data.timeLeft);
    });

    // 中断処理：Phaser -> React の中継
    game.events.on(GAME_EVENTS.GAME_INTERRUPT, (data: { score: number; timeLeft: number }) => {
      onInterruptRef.current?.(data.score, data.timeLeft);
    });
    game.events.on(GAME_EVENTS.TIMER_UPDATE, (timeLeft: number) => {
      if (timerTextRef.current) {
        timerTextRef.current.textContent = timeLeft.toFixed(2);
      }
    });

    game.scene.start("MainScene", {
      mapData: mapData,
      timeLimit: timeLimit,
    });

    phaserRef.current = game;

    return () => {
      if (phaserRef.current) {
        phaserRef.current.events.off(GAME_EVENTS.GAME_CLEAR);
        phaserRef.current.events.off(GAME_EVENTS.GAME_OVER);
        phaserRef.current.events.off(GAME_EVENTS.TIME_OVER);
        phaserRef.current.events.off(GAME_EVENTS.GAME_INTERRUPT);
        phaserRef.current.events.off(GAME_EVENTS.TIMER_UPDATE);
        phaserRef.current.destroy(true);
        phaserRef.current = null;
      }
    };
  }, [mapData, timeLimit]);

  // React側でのフォールバックイベント
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    pointerDownTimeRef.current = performance.now();
    isSwipingRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;

    if (!phaserRef.current) return;
    const scene = phaserRef.current.scene.getScene("MainScene") as MainScene;
    if (!scene) return;
    const player = scene.getPlayer?.();
    if (!player) return;

    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > SWIPE_THRESHOLD) {
      isSwipingRef.current = true;
      let dirX = 0;
      let dirY = 0;

      if (Math.abs(dx) > SWIPE_THRESHOLD) dirX = dx > 0 ? 1 : -1;
      if (Math.abs(dy) > SWIPE_THRESHOLD) dirY = dy > 0 ? 1 : -1;

      player.setTouchDirection({ x: dirX, y: dirY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!phaserRef.current) return;
    const scene = phaserRef.current.scene.getScene("MainScene") as MainScene;
    const player = scene?.getPlayer?.();

    const duration = performance.now() - pointerDownTimeRef.current;
    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < SWIPE_THRESHOLD && duration < 300 && !isSwipingRef.current) {
      if (player && typeof (player as any).triggerAttack === "function") {
        (player as any).triggerAttack();
      }
    }

    if (player && typeof (player as any).setTouchDirection === "function") {
      player.setTouchDirection({ x: 0, y: 0 });
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // 親コンポーネント（外側）からのタッチ移動指示をプレイヤーに伝えるバインド
  useEffect(() => {
    if (requestTouchMoveRef) {
      requestTouchMoveRef.current = (dir: { x: number; y: number }) => {
        if (!phaserRef.current) return;
        const scene = phaserRef.current.scene.getScene("MainScene") as MainScene;
        const player = scene?.getPlayer?.();
        if (player && typeof (player as any).setTouchDirection === "function") {
          (player as any).setTouchDirection(dir);
        }
      };
    }
    if (requestTouchActionRef) {
      requestTouchActionRef.current = () => {
        if (!phaserRef.current) return;
        const scene = phaserRef.current.scene.getScene("MainScene") as MainScene;
        const player = scene?.getPlayer?.();
        if (player && typeof (player as any).triggerAttack === "function") {
          (player as any).triggerAttack();
        }
      };
    }
    if (requestTouchReleaseRef) {
      requestTouchReleaseRef.current = () => {
        if (!phaserRef.current) return;
        const scene = phaserRef.current.scene.getScene("MainScene") as MainScene;
        const player = scene?.getPlayer?.();
        if (player && typeof (player as any).setTouchDirection === "function") {
          (player as any).setTouchDirection({ x: 0, y: 0 });
        }
      };
    }
    return () => {
      if (requestTouchMoveRef) requestTouchMoveRef.current = null;
      if (requestTouchActionRef) requestTouchActionRef.current = null;
      if (requestTouchReleaseRef) requestTouchReleaseRef.current = null;
    };
  }, [requestTouchMoveRef, requestTouchActionRef, requestTouchReleaseRef]);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-full overflow-hidden bg-black touch-none flex items-center justify-center select-none"
    >
      <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden" />

      {/* タイマーUI */}
      <div className="absolute right-4 top-4 z-20 bg-black/80 border border-teal-500/30 rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg pointer-events-none">
        <span className="text-xs font-mono text-slate-400">TIME</span>
        <span ref={timerTextRef} className="text-xl font-mono font-bold text-teal-400 tabular-nums">
          {timeLimit.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
