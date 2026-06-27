import { useState, useCallback, useRef, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { EntityData } from "@/game-core/types";
import { TileConfigKey } from "@/game-core/master";

export interface EditorSnapshot {
  name: string;
  description: string;
  timeLimit: number;
  tiles: TileConfigKey[][];
  entities: EntityData[];
  rows: number;
  cols: number;
}

export function useEditorHistory(
  methods: UseFormReturn<any>,
  tiles: string[][],
  entities: EntityData[],
  rows: number,
  cols: number,
  setRows: (r: number) => void,
  setCols: (c: number) => void,
  setTilesState: (t: TileConfigKey[][]) => void,
  setEntitiesState: (e: EntityData[]) => void,
) {
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [pointer, setPointer] = useState(-1);
  const isApplyingHistory = useRef(false);

  const getCurrentSnapshot = useCallback(
    (): EditorSnapshot => ({
      name: methods.getValues("name"),
      description: methods.getValues("description"),
      timeLimit: methods.getValues("timeLimit"),
      tiles: JSON.parse(JSON.stringify(tiles)),
      entities: JSON.parse(JSON.stringify(entities)),
      rows,
      cols,
    }),
    [methods, tiles, entities, rows, cols],
  );

  // 初期化
  useEffect(() => {
    if (tiles.length > 0 && history.length === 0) {
      setHistory([getCurrentSnapshot()]);
      setPointer(0);
    }
  }, [tiles, history.length, getCurrentSnapshot]);

  // 履歴を積む共通関数
  const pushHistory = useCallback(
    (customSnapshot?: EditorSnapshot) => {
      if (isApplyingHistory.current || isPushing.current) return;

      const nextSnapshot = customSnapshot ?? getCurrentSnapshot();

      if (history.length > 0 && pointer >= 0) {
        const last = history[pointer];
        if (
          last &&
          last.rows === nextSnapshot.rows &&
          last.cols === nextSnapshot.cols &&
          last.name === nextSnapshot.name &&
          last.description === nextSnapshot.description &&
          last.timeLimit === nextSnapshot.timeLimit &&
          JSON.stringify(last.tiles) === JSON.stringify(nextSnapshot.tiles)
        ) {
          return;
        }
      }

      isPushing.current = true;
      const nextPointer = pointer + 1;
      setHistory((prev) => [...prev.slice(0, pointer + 1), nextSnapshot]);
      setPointer(nextPointer);

      methods.setValue("mapDataCheck", nextPointer, { shouldDirty: true });

      setTimeout(() => {
        isPushing.current = false;
      }, 50);
    },
    [pointer, history, getCurrentSnapshot, methods],
  );

  const isPushing = useRef(false);

  // サイズ変更自動検知
  useEffect(() => {
    if (history.length === 0 || pointer < 0) return;
    const lastSnapshot = history[pointer];
    if (lastSnapshot && (lastSnapshot.rows !== rows || lastSnapshot.cols !== cols)) {
      pushHistory();
    }
  }, [rows, cols, history, pointer, pushHistory]);

  // 状態の適用
  const applySnapshot = useCallback(
    (snapshot: EditorSnapshot, targetPointer: number) => {
      isApplyingHistory.current = true;
      setRows(snapshot.rows);
      setCols(snapshot.cols);
      setTilesState(snapshot.tiles);
      setEntitiesState(snapshot.entities);

      methods.setValue("name", snapshot.name, { shouldValidate: true, shouldDirty: true });
      methods.setValue("description", snapshot.description, { shouldDirty: true });
      methods.setValue("timeLimit", snapshot.timeLimit, { shouldDirty: true });
      methods.setValue("mapDataCheck", targetPointer, { shouldDirty: true });

      setTimeout(() => {
        isApplyingHistory.current = false;
      }, 0);
    },
    [methods, setRows, setCols, setTilesState, setEntitiesState],
  );

  const handleUndo = useCallback(() => {
    if (pointer > 0) {
      const next = pointer - 1;
      setPointer(next);
      applySnapshot(history[next], next);
    }
  }, [pointer, history, applySnapshot]);

  const handleRedo = useCallback(() => {
    if (pointer < history.length - 1) {
      const next = pointer + 1;
      setPointer(next);
      applySnapshot(history[next], next);
    }
  }, [pointer, history, applySnapshot]);

  return {
    canUndo: pointer > 0,
    canRedo: pointer < history.length - 1,
    handleUndo,
    handleRedo,
    pushHistory,
    getCurrentSnapshot,
    setHistory,
  };
}
