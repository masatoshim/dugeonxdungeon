"use client";

import { useState } from "react";
import { useDungeonCanvas } from "@/app/(pages)/dungeons/_hook";
import { TILE_SIZE, EntityData } from "@/game-core/types";
import { TileConfigKey } from "@/game-core/master";
import { TileIconForm } from "@/app/(pages)/dungeons/_components/edit/palette/TileIconForm";

interface Props {
  tiles: TileConfigKey[][];
  entities: EntityData[];
  rows: number;
  cols: number;
  images: any;
  isLoaded: boolean;
  linkingState: any;
  onCanvasAction: (r: number, c: number) => void;
  selectedTile?: TileConfigKey;
}

export function DungeonCanvasView({
  tiles,
  entities,
  rows,
  cols,
  images,
  isLoaded,
  linkingState,
  onCanvasAction,
  selectedTile = " ",
}: Props) {
  const { canvasRef } = useDungeonCanvas({
    tiles,
    entities,
    rows,
    cols,
    images,
    isLoaded,
    linkingState,
  });

  // キャンバス領域内の相対マウス位置 (px)
  const [localMousePos, setLocalMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // マウスイベントからキャンバス内部のpx座標と行列Indexを取得する
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // キャンバス内部の相対座標 (px)
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const c = Math.floor(x / TILE_SIZE);
    const r = Math.floor(y / TILE_SIZE);

    return { x, y, r, c };
  };

  const handlePointerEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const { r, c } = coords;
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      onCanvasAction(r, c);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    setLocalMousePos({ x: coords.x, y: coords.y });
    if (e.buttons === 1) {
      handlePointerEvent(e);
    }
  };

  return (
    <div
      className="m-auto relative shadow-2xl ring-4 ring-black"
      style={{ width: cols * TILE_SIZE, height: rows * TILE_SIZE }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-amber-500 z-10">
          Loading Assets...
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={cols * TILE_SIZE}
        height={rows * TILE_SIZE}
        onMouseDown={handlePointerEvent}
        onMouseMove={handleMouseMove}
        className="bg-gray-800 cursor-crosshair block w-full h-full"
      />

      {/* マウスカーソル画像を表示 */}
      {isHovered && selectedTile !== " " && (
        <div
          className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 opacity-80 scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-transform duration-75 ease-out"
          style={{
            left: localMousePos.x,
            top: localMousePos.y,
          }}
        >
          <TileIconForm tileId={selectedTile} size={TILE_SIZE} />
        </div>
      )}
    </div>
  );
}
