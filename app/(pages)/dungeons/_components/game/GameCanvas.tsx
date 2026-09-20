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
}

export default function GameCanvas({
  mapData,
  timeLimit,
  onClear,
  onGameOver,
  onInterrupt,
  requestInterruptRef,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserRef = useRef<Phaser.Game | null>(null);

  // コールバック参照の保持
  const onClearRef = useRef(onClear);
  const onGameOverRef = useRef(onGameOver);
  const onInterruptRef = useRef(onInterrupt);

  useEffect(() => {
    onClearRef.current = onClear;
    onGameOverRef.current = onGameOver;
  }, [onClear, onGameOver]);

  useEffect(() => {
    onInterruptRef.current = onInterrupt;
  }, [onInterrupt]);

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
      physics: {
        default: "arcade",
        arcade: { debug: false }, // Todo: 当たり判定表示.開発時はtrueに
      },
    };

    const game = new Phaser.Game(config);

    // Phaserのイベントリスナー登録
    game.events.on(GAME_EVENTS.GAME_CLEAR, (data: { score: number; timeLeft: number }) => {
      onClearRef.current?.(data.score, data.timeLeft);
    });
    game.events.on(GAME_EVENTS.GAME_OVER, (data: { score: number; timeLeft: number }) => {
      onGameOverRef.current?.(data.score, data.timeLeft);
    });
    game.events.on(GAME_EVENTS.TIME_OVER, (data: { score: number; timeLeft: number }) => {
      onGameOverRef.current?.(data.score, data.timeLeft);
    });

    // Phaser -> React の中継
    game.events.on(GAME_EVENTS.GAME_INTERRUPT, (data: { score: number; timeLeft: number }) => {
      onInterruptRef.current?.(data.score, data.timeLeft);
    });

    // React -> Phaserの合図を受け取る仕組み
    if (requestInterruptRef) {
      requestInterruptRef.current = () => {
        game.events.emit(GAME_EVENTS.REQUEST_INTERRUPT);
      };
    }

    // Sceneの開始
    game.scene.add("MainScene", MainScene);
    game.scene.start("MainScene", {
      mapData: mapData,
      timeLimit: timeLimit,
    });

    phaserRef.current = game;

    // クリーンアップ
    return () => {
      if (requestInterruptRef) {
        requestInterruptRef.current = null;
      }
      if (phaserRef.current) {
        phaserRef.current.events.off(GAME_EVENTS.GAME_CLEAR);
        phaserRef.current.events.off(GAME_EVENTS.GAME_OVER);
        phaserRef.current.events.off(GAME_EVENTS.TIME_OVER);
        phaserRef.current.events.off(GAME_EVENTS.GAME_INTERRUPT);
        phaserRef.current.destroy(true);
        phaserRef.current = null;
      }
      game.destroy(true);
    };
  }, [mapData, timeLimit]);

  return <div ref={containerRef} className="border-4 border-gray-700 rounded-lg overflow-hidden bg-black" />;
}
