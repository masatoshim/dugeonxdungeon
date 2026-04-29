"use client";

import { useDungeonCanvas } from "@/app/(pages)/dungeons/_hook";

interface Props {
  tiles: string[][];
  entities: any[];
  rows: number;
  cols: number;
  images: any;
  isLoaded: boolean;
  linkingState: any;
  onCanvasAction: (r: number, c: number) => void;
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
}: Props) {
  const TILE_SIZE = 32;
  const { canvasRef } = useDungeonCanvas({
    tiles,
    entities,
    rows,
    cols,
    images,
    isLoaded,
    linkingState,
  });

  const handlePointerEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const c = Math.floor(x / TILE_SIZE);
    const r = Math.floor(y / TILE_SIZE);

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      onCanvasAction(r, c);
    }
  };

  return (
    <div className="m-auto relative shadow-2xl ring-4 ring-black">
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
        onMouseMove={(e) => {
          if (e.buttons === 1) handlePointerEvent(e);
        }}
        className="bg-gray-800 cursor-crosshair block"
      />
    </div>
  );
}
