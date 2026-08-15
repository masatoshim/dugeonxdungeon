import { useState, useCallback, useRef } from "react";
import { TILE_CONFIG, TileConfigKey } from "@/game-core/master";
import { TILE_CATEGORIES, EntityData, DUNGEON_DEFAULT } from "@/game-core/types";
import { toast } from "sonner";
import { nanoid } from "nanoid";

// 内部ロジック判定用
interface LinkingStateType {
  active: boolean;
  mode: "KEY_DOOR" | "BUTTON_DOOR" | "LEVER_SWITCH_DOOR" | "WARP" | "WARP_TWO_WAY" | null;
  pendingType:
    | "KEY"
    | "KEY_DOOR"
    | "BUTTON"
    | "BUTTON_DOOR"
    | "LEVER_SWITCH"
    | "LEVER_SWITCH_DOOR"
    | "WARP_IN"
    | "WARP_OUT"
    | "WARP_TWO_WAY1"
    | "WARP_TWO_WAY2"
    | null;
  firstEntityId: string | null;
}

const INITIAL_LINKING_STATE: LinkingStateType = {
  active: false,
  mode: null,
  pendingType: null,
  firstEntityId: null,
};

export function useDungeonEditorLogic(initialData?: any) {
  // ダンジョンサイズ状態
  const [rows, setRows] = useState(initialData?.mapData?.height || DUNGEON_DEFAULT.ROWS);
  const [cols, setCols] = useState(initialData?.mapData?.width || DUNGEON_DEFAULT.COLS);

  // タイルデータ初期化
  const [tiles, setTiles] = useState<TileConfigKey[][]>(() => {
    if (initialData?.mapData?.tiles) return initialData.mapData.tiles;
    return Array(DUNGEON_DEFAULT.ROWS)
      .fill(0)
      .map((_, r) =>
        Array(DUNGEON_DEFAULT.COLS)
          .fill(0)
          .map((_, c) =>
            r === 0 || r === DUNGEON_DEFAULT.ROWS - 1 || c === 0 || c === DUNGEON_DEFAULT.COLS - 1 ? "W" : " ",
          ),
      );
  });

  const [entities, setEntities] = useState<EntityData[]>(initialData?.mapData?.entities || []);

  // ロジックのコア判定
  const linkingRef = useRef<LinkingStateType>(INITIAL_LINKING_STATE);

  // UI描画のState
  const [linkingState, setLinkingState] = useState<LinkingStateType>(INITIAL_LINKING_STATE);

  const updateLinking = useCallback((nextState: LinkingStateType) => {
    linkingRef.current = nextState;
    setLinkingState(nextState);
  }, []);

  const cancelLinking = useCallback(() => {
    updateLinking(INITIAL_LINKING_STATE);
  }, [updateLinking]);

  // 履歴（Undo/Redo）用
  const setTilesState = useCallback((newTiles: TileConfigKey[][]) => {
    setTiles(newTiles);
  }, []);

  const setEntitiesState = useCallback((newEntities: EntityData[]) => {
    setEntities(newEntities);
  }, []);

  // エンティティタイプ取得
  const getEntityType = useCallback((tileId: TileConfigKey) => {
    const config = TILE_CONFIG[tileId];
    return config?.linkConfig?.entityType ?? null;
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
        .map(() => Array(newCols).fill(" "));

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

  // セルクリック（設置・消去）ロジック
  const handleCellClick = useCallback(
    (r: number, c: number, selectedTile: TileConfigKey) => {
      // 境界チェック (外壁には設置不可)
      if (r <= 0 || r >= rows - 1 || c <= 0 || c >= cols - 1) return;

      const isEraser = selectedTile === " ";

      if (linkingRef.current.active && isEraser) {
        cancelLinking();
      }

      const config = TILE_CONFIG[selectedTile];
      const category = config?.category;
      const linkConfig = config?.linkConfig;

      const incomingType = getEntityType(selectedTile);
      const isGimmick = category === TILE_CATEGORIES.GIMMICK || incomingType !== null;

      // リンク待機中のチェック
      if (linkingRef.current.active && !isEraser) {
        if (!isGimmick || incomingType !== linkingRef.current.pendingType) {
          toast.error("正しく対になるギミックを設置してください");
          return;
        }
      }

      // プレイヤー単一チェック
      if (category === TILE_CATEGORIES.PLAYER) {
        let hasPlayer = false;
        setTiles((prev) => {
          hasPlayer = prev.flat().some((t) => TILE_CONFIG[t]?.category === TILE_CATEGORIES.PLAYER);
          return prev;
        });

        if (hasPlayer) {
          toast.error("プレイヤーは1つのみです");
          return;
        }
      }

      const newId = `${selectedTile}_${nanoid(8)}`;

      let isPairingCompleteRoute = false;
      let currentFirstEntityId: string | null = null;

      // ペアリング状態の更新
      if (!isEraser && isGimmick && incomingType) {
        if (!linkingRef.current.active && linkConfig) {
          updateLinking({
            active: true,
            mode: linkConfig.linkGroup,
            pendingType: linkConfig.targetEntityType,
            firstEntityId: newId,
          });
        } else {
          isPairingCompleteRoute = true;
          currentFirstEntityId = linkingRef.current.firstEntityId;
          updateLinking(INITIAL_LINKING_STATE);
        }
      }

      setTiles((prev) =>
        prev.map((row, rIdx) =>
          rIdx === r ? row.map((cell, cIdx) => (cIdx === c ? (isGimmick ? " " : selectedTile) : cell)) : row,
        ),
      );

      setEntities((prev) => {
        // 設置先セルにあった古いエンティティを取り除く
        const filtered = prev.filter((e) => !(e.x === c && e.y === r));

        if (!isEraser && isGimmick && incomingType) {
          if (!isPairingCompleteRoute) {
            const newEntity: EntityData = {
              id: newId,
              tileId: selectedTile,
              x: c,
              y: r,
            };
            return [...filtered, newEntity];
          } else {
            const firstId = currentFirstEntityId;
            const newEntity: EntityData = {
              id: newId,
              tileId: selectedTile,
              x: c,
              y: r,
              properties: { targetId: firstId! },
            };
            return filtered
              .map((e) => (e.id === firstId ? { ...e, properties: { ...e.properties, targetId: newId } } : e))
              .concat(newEntity);
          }
        }

        // 消しゴムまたはギミック以外のタイルを置いた場合は、古いエンティティを消去した配列をそのまま返す
        return filtered;
      });
    },
    [rows, cols, getEntityType, cancelLinking, updateLinking],
  );

  return {
    tiles,
    setTilesState,
    entities,
    setEntitiesState,
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
