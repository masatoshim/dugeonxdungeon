import { useState, useRef, useEffect, useCallback } from "react";
import { ASSETS, TILE_CONFIG, TileConfigKey } from "@/game-core/master";
import { TILE_SIZE, EntityData } from "@/game-core/types";

interface UseDungeonCanvasProps {
  tiles: TileConfigKey[][];
  entities: EntityData[];
  rows: number;
  cols: number;
  linkingState: {
    active: boolean;
    firstEntityId: string | null;
  };
}

export function useDungeonCanvas({ tiles, entities, rows, cols, linkingState }: UseDungeonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 画像オブジェクトとロード完了フラグをキャッシュするマップ
  const imageCacheRef = useRef<Map<string, { img: HTMLImageElement; isLoaded: boolean }>>(new Map());

  // 画像ロード完了時に再描画を走らせるためのステート
  const [renderKey, setRenderKey] = useState(0);

  // 画像を取得または非同期でロードする関数
  const getOrLoadImage = useCallback((src: string): HTMLImageElement | null => {
    const cache = imageCacheRef.current;

    if (cache.has(src)) {
      const cached = cache.get(src)!;
      return cached.isLoaded ? cached.img : null;
    }

    const img = new window.Image();
    const entry = { img, isLoaded: false };
    cache.set(src, entry);

    img.onload = () => {
      entry.isLoaded = true;
      // 画像の読み込みが完了したら renderKey を更新して再描画をトリガーする
      setRenderKey((n) => n + 1);
    };

    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
    };

    img.src = src;
    return null;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
        // 床などの基本タイルを描画
        const textureSrc = config?.texture ? ASSETS[config.texture] : null;
        if (textureSrc) {
          const img = getOrLoadImage(textureSrc);
          if (img) {
            ctx.drawImage(img, 0, 0, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
          }
        }

        // エンティティ（鍵や扉など）の描画
        const entity = entityMap.get(`${c}-${r}`);
        if (entity) {
          const entityTileId = entity.tileId;
          const entityConfig = entityTileId ? TILE_CONFIG[entityTileId] : null;
          const entityTextureSrc = entityConfig?.texture ? ASSETS[entityConfig.texture] : null;

          if (entityTextureSrc) {
            const entityImg = getOrLoadImage(entityTextureSrc);
            if (entityImg) {
              ctx.drawImage(entityImg, 0, 0, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
            }
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
  }, [tiles, entities, rows, cols, linkingState.firstEntityId, getOrLoadImage]);

  // マウント時、データ変更時、および画像ロード完了時に描画を走らせる
  useEffect(() => {
    draw();
  }, [draw, renderKey]);

  return { canvasRef };
}
