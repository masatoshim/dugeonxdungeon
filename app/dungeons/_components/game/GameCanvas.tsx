import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { MainScene } from "@/game-core/scenes/MainScene";
import { MapData } from "@/types";

interface GameCanvasProps {
  mapData: MapData;
  timeLimit: number;
  onClear?: (score: number) => void;
  onGameOver?: () => void;
}

export default function GameCanvas({ mapData, timeLimit, onClear, onGameOver }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserRef = useRef<Phaser.Game | null>(null);

  const onClearRef = useRef(onClear);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => {
    onClearRef.current = onClear;
    onGameOverRef.current = onGameOver;
  }, [onClear, onGameOver]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (phaserRef.current) return; // 二重生成防止

    // イベントリスナー：Phaserからの通知を受け取る
    const handleGameClearEvent = (e: any) => {
      onClearRef.current?.(e.detail.score);
    };

    const handleGameOverEvent = () => {
      onGameOverRef.current?.();
    };

    window.addEventListener("game-clear", handleGameClearEvent);
    window.addEventListener("game-over", handleGameOverEvent);

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
    game.scene.add("MainScene", MainScene);
    game.scene.start("MainScene", {
      mapData: mapData,
      timeLimit: timeLimit,
    });

    phaserRef.current = game;

    // クリーンアップ処理
    return () => {
      window.removeEventListener("game-clear", handleGameClearEvent);
      window.removeEventListener("game-over", handleGameOverEvent);
      if (phaserRef.current) {
        phaserRef.current.destroy(true);
        phaserRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="border-4 border-gray-700 rounded-lg overflow-hidden bg-black" />;
}
