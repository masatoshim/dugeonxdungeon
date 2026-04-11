import { useState, useCallback } from "react";
import { TILE_CONFIG, TILE_CATEGORIES, EntityData, TileConfigKey, DUNGEON_DEFAULT } from "@/types";
import { toast } from "sonner";

/**
 * ダンジョン編集ロジック
 * @param initialData
 * @returns
 */
export function useDungeonEditorLogic(initialData?: any) {
  // ダンジョンサイズ状態
  const [rows, setRows] = useState(initialData?.mapData?.height || DUNGEON_DEFAULT.ROWS);
  const [cols, setCols] = useState(initialData?.mapData?.width || DUNGEON_DEFAULT.COLS);

  // タイルデータ初期化
  const [tiles, setTiles] = useState<string[][]>(() => {
    if (initialData?.mapData?.tiles) return initialData.mapData.tiles;
    return Array(DUNGEON_DEFAULT.ROWS)
      .fill(0)
      .map((_, r) =>
        Array(DUNGEON_DEFAULT.COLS)
          .fill(0)
          .map((_, c) =>
            r === 0 || r === DUNGEON_DEFAULT.ROWS - 1 || c === 0 || c === DUNGEON_DEFAULT.COLS - 1 ? "W" : "..",
          ),
      );
  });

  const [entities, setEntities] = useState<EntityData[]>(initialData?.mapData?.entities || []);

  const [linkingState, setLinkingState] = useState({
    active: false,
    mode: null as "KEY_DOOR" | "BUTTON_DOOR" | null,
    pendingType: null as "KEY" | "DOOR" | "BUTTON" | null,
    firstEntityId: null as string | null,
  });

  // 設置しようとしているタイルがどのエンティティタイプかを判定
  const getEntityType = useCallback((tileId: string) => {
    if (tileId.startsWith("K1")) return "KEY";
    if (tileId.startsWith("KD1")) return "DOOR";
    if (tileId.startsWith("B1")) return "BUTTON";
    if (tileId.startsWith("D1")) return "DOOR";
    return null;
  }, []);

  // サイズ変更ロジック
  const updateTilesSize = useCallback((newRows: number, newCols: number) => {
    setRows(newRows);
    setCols(newCols);
    setTiles((prev) => {
      const oldRows = prev.length;
      const oldCols = prev[0].length;
      const nextTiles = Array(newRows)
        .fill(0)
        .map(() => Array(newCols).fill(".."));

      for (let r = 0; r < newRows; r++) {
        for (let c = 0; c < newCols; c++) {
          if (r < oldRows && c < oldCols) {
            const isOldEdge = r === 0 || r === oldRows - 1 || c === 0 || c === oldCols - 1;
            if (!isOldEdge) nextTiles[r][c] = prev[r][c];
          }
          if (r === 0 || r === newRows - 1 || c === 0 || c === newCols - 1) nextTiles[r][c] = "W";
        }
      }
      return nextTiles;
    });
    setEntities((prev) => prev.filter((e) => e.x < newCols - 1 && e.y < newRows - 1));
  }, []);

  // セルクリック（設置）ロジック
  const handleCellClick = useCallback(
    (r: number, c: number, selectedTile: string) => {
      // 境界チェック (外壁には設置不可)
      if (r <= 0 || r >= rows - 1 || c <= 0 || c >= cols - 1) return;

      const isEraser = selectedTile === "..";
      const config = TILE_CONFIG[selectedTile as TileConfigKey];
      const category = config?.category;
      const isGimmick = category === TILE_CATEGORIES.GIMMICK;
      const incomingType = getEntityType(selectedTile);

      // ペアリング中のバリデーション
      if (linkingState.active && !isEraser) {
        if (!isGimmick || incomingType !== linkingState.pendingType) {
          toast.error("セット設置を優先してください");
          return;
        }
      }

      // プレイヤー単一チェック
      if (category === TILE_CATEGORIES.PLAYER) {
        const hasPlayer = tiles
          .flat()
          .some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.PLAYER);
        if (hasPlayer) {
          toast.error("プレイヤーは1つのみです");
          return;
        }
      }

      const newId = `${selectedTile}_${crypto.randomUUID().slice(0, 8)}`;

      // タイル更新
      setTiles((prev) => {
        const next = [...prev];
        next[r] = [...next[r]];
        next[r][c] = isGimmick ? ".." : selectedTile;
        return next;
      });

      // エンティティ更新
      setEntities((prev) => {
        const filtered = prev.filter((e) => !(e.x === c && e.y === r));
        if (isEraser) return filtered;

        if (isGimmick && incomingType) {
          const newEntity: EntityData = {
            id: newId,
            type: incomingType,
            x: c,
            y: r,
            properties: { tileId: selectedTile },
          };

          if (!linkingState.active) {
            const mode = incomingType === "KEY" || selectedTile === "KD1" ? "KEY_DOOR" : "BUTTON_DOOR";
            const pendingType = incomingType === "DOOR" ? (mode === "KEY_DOOR" ? "KEY" : "BUTTON") : "DOOR";
            setLinkingState({ active: true, mode, pendingType, firstEntityId: newId });
            return [...filtered, newEntity];
          } else {
            const firstId = linkingState.firstEntityId;
            setLinkingState({ active: false, mode: null, pendingType: null, firstEntityId: null });
            const updatedPrev = filtered.map((e) =>
              e.id === firstId ? { ...e, properties: { ...e.properties, targetId: newId } } : e,
            );
            return [...updatedPrev, { ...newEntity, properties: { ...newEntity.properties, targetId: firstId! } }];
          }
        }
        return filtered;
      });
    },
    [rows, cols, tiles, linkingState, getEntityType],
  );

  return {
    tiles,
    setTiles,
    entities,
    setEntities,
    rows,
    setRows,
    cols,
    setCols,
    linkingState,
    handleCellClick,
    updateTilesSize,
    getEntityType,
  };
}
