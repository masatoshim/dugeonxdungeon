import { useCallback, useRef, useEffect } from "react";
import { TILE_CONFIG, TileConfigKey, EntityData } from "@/types";

interface UseDungeonCanvasProps {
  tiles: string[][];
  entities: EntityData[];
  rows: number;
  cols: number;
  images: Record<string, HTMLImageElement>;
  isLoaded: boolean;
  linkingState: {
    active: boolean;
    firstEntityId: string | null;
  };
}

export function useDungeonCanvas({
  tiles,
  entities,
  rows,
  cols,
  images,
  isLoaded,
  linkingState,
}: UseDungeonCanvasProps) {
  const TILE_SIZE = 32;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const entityMap = new Map<string, EntityData>();
    entities.forEach((e) => entityMap.set(`${e.x}-${e.y}`, e));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = c * TILE_SIZE;
        const dy = r * TILE_SIZE;
        const tileId = tiles[r][c];
        const img = images[tileId];
        const config = TILE_CONFIG[tileId as TileConfigKey];

        // 床などの基本タイルを描画
        if (img && config) {
          const frameIndex = config.frame || 0;
          const sx = frameIndex * TILE_SIZE;
          const sy = 0;

          ctx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
        }

        // エンティティ（鍵や扉）の描画
        const entity = entityMap.get(`${c}-${r}`);
        if (entity) {
          const entityTileId = entity.properties?.tileId;
          const entityImg = entityTileId ? images[entityTileId] : null;
          const entityConfig = entityTileId ? TILE_CONFIG[entityTileId as TileConfigKey] : null;

          if (entityImg && entityConfig) {
            const esx = (entityConfig.frame || 0) * TILE_SIZE;
            ctx.drawImage(entityImg, esx, 0, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
          }

          // セット設置中のハイライト
          if (entity.id === linkingState.firstEntityId) {
            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth = 2;
            ctx.strokeRect(dx + 2, dy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.fillStyle = "rgba(245, 158, 11, 0.2)";
            ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
          }
        }

        // グリッド線の描画
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(dx, dy, TILE_SIZE, TILE_SIZE);
      }
    }
  }, [tiles, entities, rows, cols, isLoaded, images, linkingState.firstEntityId]);

  useEffect(() => {
    draw();
  }, [draw]);

  return { canvasRef };
}
