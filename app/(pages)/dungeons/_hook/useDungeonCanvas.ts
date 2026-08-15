import { useCallback, useRef, useEffect } from "react";
import { TILE_CONFIG, TileConfigKey } from "@/game-core/master";
import { EntityData } from "@/game-core/types";
import { TILE_SIZE } from "@/game-core/types";

interface UseDungeonCanvasProps {
  tiles: TileConfigKey[][];
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const targetWidth = cols * TILE_SIZE;
    const targetHeight = rows * TILE_SIZE;

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const entityMap = new Map<string, EntityData>();
    entities.forEach((e) => entityMap.set(`${e.x}-${e.y}`, e));

    for (let r = 0; r < rows; r++) {
      const row = tiles[r];
      if (!row) continue;

      for (let c = 0; c < cols; c++) {
        const tileId = row[c];
        if (tileId === undefined) continue;

        const dx = c * TILE_SIZE;
        const dy = r * TILE_SIZE;

        // マスタ設定を先に取得する
        const config = TILE_CONFIG[tileId];
        // 登録されているテクスチャキー（例: "wall"）を使って images から画像を探す
        const img = config?.texture ? images[config.texture] : null;

        // 床などの基本タイルを描画
        if (img && config) {
          const sx = 0;
          const sy = 0;

          ctx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
        }

        // エンティティ（鍵や扉）の描画
        const entity = entityMap.get(`${c}-${r}`);
        if (entity) {
          const entityTileId = entity.tileId;
          const entityConfig = entityTileId ? TILE_CONFIG[entityTileId] : null;
          const entityImg = entityConfig?.texture ? images[entityConfig.texture] : null;

          if (entityImg && entityConfig) {
            ctx.drawImage(entityImg, 0, 0, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
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
