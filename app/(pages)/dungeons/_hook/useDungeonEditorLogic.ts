import { useState, useCallback, useRef } from "react";
import { TILE_CONFIG } from "@/game-core/master";
import { TILE_CATEGORIES, EntityData, TileConfigKey, DUNGEON_DEFAULT } from "@/game-core/types";
import { toast } from "sonner";

// 内部ロジック判定用
interface LinkingRefType {
  active: boolean;
  mode: "KEY_DOOR" | "BUTTON_DOOR" | null;
  pendingType: "KEY" | "KEY_DOOR" | "BUTTON" | "BUTTON_DOOR" | null;
  firstEntityId: string | null;
}

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

  // ロジックのコア判定
  const linkingRef = useRef<LinkingRefType>({
    active: false,
    mode: null,
    pendingType: null,
    firstEntityId: null,
  });

  // UI描画のState
  const [linkingState, setLinkingState] = useState({
    active: false,
    mode: null as "KEY_DOOR" | "BUTTON_DOOR" | null,
    pendingType: null as "KEY" | "KEY_DOOR" | "BUTTON" | "BUTTON_DOOR" | null,
    firstEntityId: null as string | null,
  });

  // 履歴（Undo/Redo）からステートを直接復元するための更新関数
  // useCallback でラップし、親側での不要な再レンダリングやエフェクトのトリガーを防ぎます
  const setTilesState = useCallback((newTiles: string[][]) => {
    setTiles(newTiles);
  }, []);

  const setEntitiesState = useCallback((newEntities: EntityData[]) => {
    setEntities(newEntities);
  }, []);

  // 設置しようとしているタイルがどのエンティティタイプかを判定
  const getEntityType = useCallback((tileId: string) => {
    if (tileId.startsWith("K1")) return "KEY";
    if (tileId.startsWith("KD1")) return "KEY_DOOR";
    if (tileId.startsWith("B1")) return "BUTTON";
    if (tileId.startsWith("D1")) return "BUTTON_DOOR";
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

  const cancelLinking = useCallback(() => {
    linkingRef.current = { active: false, mode: null, pendingType: null, firstEntityId: null };
    setLinkingState({ active: false, mode: null, pendingType: null, firstEntityId: null });
  }, []);

  // セルクリック（設置）ロジック
  const handleCellClick = useCallback(
    (r: number, c: number, selectedTile: string) => {
      // 境界チェック (外壁には設置不可)
      if (r <= 0 || r >= rows - 1 || c <= 0 || c >= cols - 1) return;

      const isEraser = selectedTile === "..";

      if (linkingRef.current.active && isEraser) {
        cancelLinking();
      }

      const config = TILE_CONFIG[selectedTile as TileConfigKey];
      const category = config?.category;

      const incomingType = getEntityType(selectedTile);
      const isGimmick = category === TILE_CATEGORIES.GIMMICK || incomingType !== null;

      if (linkingRef.current.active && !isEraser) {
        if (!isGimmick || incomingType !== linkingRef.current.pendingType) {
          toast.error("正しく対になるギミック（ボタンまたはドア/鍵または鍵扉）を設置してください");
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

      let isPairingCompleteRoute = false;
      let currentFirstEntityId: string | null = null;

      if (!isEraser && isGimmick && incomingType) {
        if (!linkingRef.current.active) {
          let mode: "KEY_DOOR" | "BUTTON_DOOR" = "KEY_DOOR";
          let pendingType: "KEY" | "KEY_DOOR" | "BUTTON" | "BUTTON_DOOR" = "KEY_DOOR";

          if (selectedTile === "K1") {
            mode = "KEY_DOOR";
            pendingType = "KEY_DOOR"; // 鍵が置かれたら次は 鍵扉 を待つ
          } else if (selectedTile === "KD1") {
            mode = "KEY_DOOR";
            pendingType = "KEY"; // 鍵扉が置かれたら次は 鍵 を待つ
          } else if (selectedTile === "B1") {
            mode = "BUTTON_DOOR";
            pendingType = "BUTTON_DOOR"; // ボタンが置かれたら次は ボタン扉 を待つ
          } else if (selectedTile === "D1") {
            mode = "BUTTON_DOOR";
            pendingType = "BUTTON"; // ボタン扉が置かれたら次は ボタン を待つ
          }

          linkingRef.current = { active: true, mode, pendingType, firstEntityId: newId };
          setLinkingState({ active: true, mode, pendingType, firstEntityId: newId });
        } else {
          isPairingCompleteRoute = true;
          currentFirstEntityId = linkingRef.current.firstEntityId;

          linkingRef.current = { active: false, mode: null, pendingType: null, firstEntityId: null };
          setLinkingState({ active: false, mode: null, pendingType: null, firstEntityId: null });
        }
      }

      setTiles((prev) => {
        const next = [...prev];
        next[r] = [...next[r]];
        next[r][c] = isGimmick ? ".." : selectedTile;
        return next;
      });

      const savedEntityType = incomingType === "KEY_DOOR" || incomingType === "BUTTON_DOOR" ? "DOOR" : incomingType;

      if (!isEraser && isGimmick && incomingType) {
        if (!isPairingCompleteRoute) {
          setEntities((prev) => {
            const filtered = prev.filter((e) => !(e.x === c && e.y === r));
            const newEntity: EntityData = {
              id: newId,
              type: savedEntityType!,
              x: c,
              y: r,
              properties: { tileId: selectedTile },
            };
            return [...filtered, newEntity];
          });
        } else {
          const firstId = currentFirstEntityId;
          setEntities((prev) => {
            const filtered = prev.filter((e) => !(e.x === c && e.y === r));
            const newEntity: EntityData = {
              id: newId,
              type: savedEntityType!,
              x: c,
              y: r,
              properties: { tileId: selectedTile, targetId: firstId! },
            };
            return filtered
              .map((e) => (e.id === firstId ? { ...e, properties: { ...e.properties, targetId: newId } } : e))
              .concat(newEntity);
          });
        }
      } else {
        setEntities((prev) => prev.filter((e) => !(e.x === c && e.y === r)));
      }
    },
    [rows, cols, tiles, getEntityType, cancelLinking],
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
