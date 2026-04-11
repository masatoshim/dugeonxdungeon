import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { MainScene } from "@/game-core/scenes/MainScene";
import { GAME_EVENTS, MapData } from "@/types";

interface GameCanvasProps {
  mapData: MapData;
  timeLimit: number;
  onClear?: (score: number) => void;
  onGameOver?: () => void;
}

export default function GameCanvas({ mapData, timeLimit, onClear, onGameOver }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserRef = useRef<Phaser.Game | null>(null);

  // コールバック参照の保持
  const onClearRef = useRef(onClear);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => {
    onClearRef.current = onClear;
    onGameOverRef.current = onGameOver;
  }, [onClear, onGameOver]);

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
        arcade: { debug: true }, // Todo: 当たり判定表示.開発時はtrueに
      },
    };

    const game = new Phaser.Game(config);

    // Phaserのイベントリスナー登録
    game.events.on(GAME_EVENTS.GAME_CLEAR, (data: { score: number }) => {
      onClearRef.current?.(data.score);
    });
    game.events.on(GAME_EVENTS.GAME_OVER, () => {
      onGameOverRef.current?.();
    });
    game.events.on(GAME_EVENTS.TIME_OVER, () => {
      onGameOverRef.current?.();
    });

    // Sceneの開始
    game.scene.add("MainScene", MainScene);
    game.scene.start("MainScene", {
      mapData: mapData,
      timeLimit: timeLimit,
    });

    phaserRef.current = game;

    // クリーンアップ
    return () => {
      if (phaserRef.current) {
        phaserRef.current.events.off(GAME_EVENTS.GAME_CLEAR);
        phaserRef.current.events.off(GAME_EVENTS.GAME_OVER);
        phaserRef.current.events.off(GAME_EVENTS.TIME_OVER);
        phaserRef.current.destroy(true);
        phaserRef.current = null;
      }
    };
  }, [mapData, timeLimit]);

  return <div ref={containerRef} className="border-4 border-gray-700 rounded-lg overflow-hidden bg-black" />;
}
