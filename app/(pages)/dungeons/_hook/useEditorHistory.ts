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
  tiles: TileConfigKey[][],
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
  const isPushing = useRef(false);

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
      if (isApplyingHistory.current || isPushing.current || history.length === 0) return;

      const nextSnapshot = customSnapshot ?? getCurrentSnapshot();
      const initialSnapshot = history[0];

      // マップ・時間・メタデータが初期状態と完全に一致したか判定
      const isMapOrTimeEqualInitial =
        initialSnapshot.rows === nextSnapshot.rows &&
        initialSnapshot.cols === nextSnapshot.cols &&
        initialSnapshot.timeLimit === nextSnapshot.timeLimit &&
        JSON.stringify(initialSnapshot.tiles) === JSON.stringify(nextSnapshot.tiles) &&
        JSON.stringify(initialSnapshot.entities) === JSON.stringify(nextSnapshot.entities);

      const isMetaEqualInitial =
        initialSnapshot.name === nextSnapshot.name && initialSnapshot.description === nextSnapshot.description;

      // 直前の履歴と同じなら何もしない
      if (pointer >= 0) {
        const last = history[pointer];
        if (
          last &&
          last.rows === nextSnapshot.rows &&
          last.cols === nextSnapshot.cols &&
          last.name === nextSnapshot.name &&
          last.description === nextSnapshot.description &&
          last.timeLimit === nextSnapshot.timeLimit &&
          JSON.stringify(last.tiles) === JSON.stringify(nextSnapshot.tiles) &&
          JSON.stringify(last.entities) === JSON.stringify(nextSnapshot.entities)
        ) {
          return;
        }
      }

      isPushing.current = true;

      if (isMapOrTimeEqualInitial && isMetaEqualInitial) {
        setPointer(0);
        methods.setValue("mapDataCheck", 0, { shouldDirty: true });
        methods.setValue("metaDataCheck", 0, { shouldDirty: true });
        setTimeout(() => {
          isPushing.current = false;
        }, 50);
        return;
      }

      const nextPointer = pointer + 1;
      setHistory((prev) => [...prev.slice(0, pointer + 1), nextSnapshot]);
      setPointer(nextPointer);

      // 通常の変更判定
      const isMapOrTimeChanged = !isMapOrTimeEqualInitial;
      const isMetaChanged = !isMetaEqualInitial;

      methods.setValue("mapDataCheck", isMapOrTimeChanged ? nextPointer : 0, { shouldDirty: true });
      methods.setValue("metaDataCheck", isMetaChanged ? nextPointer : 0, { shouldDirty: true });

      setTimeout(() => {
        isPushing.current = false;
      }, 50);
    },
    [pointer, history, getCurrentSnapshot, methods],
  );

  // サイズ変更自動検知
  useEffect(() => {
    if (history.length === 0 || pointer < 0) return;
    const lastSnapshot = history[pointer];
    if (lastSnapshot && (lastSnapshot.rows !== rows || lastSnapshot.cols !== cols)) {
      pushHistory();
    }
  }, [rows, cols, history, pointer, pushHistory]);

  // 状態の適用（Undo / Redo）
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

      // 履歴の先頭と比較
      const initialSnapshot = history[0];

      const isMapOrTimeChanged =
        !initialSnapshot ||
        initialSnapshot.rows !== snapshot.rows ||
        initialSnapshot.cols !== snapshot.cols ||
        initialSnapshot.timeLimit !== snapshot.timeLimit ||
        JSON.stringify(initialSnapshot.tiles) !== JSON.stringify(snapshot.tiles) ||
        JSON.stringify(initialSnapshot.entities) !== JSON.stringify(snapshot.entities);

      const isMetaChanged =
        !initialSnapshot ||
        initialSnapshot.name !== snapshot.name ||
        initialSnapshot.description !== snapshot.description;

      methods.setValue("mapDataCheck", isMapOrTimeChanged ? targetPointer : 0, { shouldDirty: true });
      methods.setValue("metaDataCheck", isMetaChanged ? targetPointer : 0, { shouldDirty: true });

      setTimeout(() => {
        isApplyingHistory.current = false;
      }, 0);
    },
    [methods, setRows, setCols, setTilesState, setEntitiesState, history],
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

  const checkAndResetIfInitial = useCallback(() => {
    if (history.length === 0) return;
    const nextSnapshot = getCurrentSnapshot();

    const baseSnapshot = history[0];

    const isMapOrTimeEqualInitial =
      baseSnapshot.rows === nextSnapshot.rows &&
      baseSnapshot.cols === nextSnapshot.cols &&
      baseSnapshot.timeLimit === nextSnapshot.timeLimit &&
      JSON.stringify(baseSnapshot.tiles) === JSON.stringify(nextSnapshot.tiles) &&
      JSON.stringify(baseSnapshot.entities) === JSON.stringify(nextSnapshot.entities);

    const isMetaEqualInitial =
      baseSnapshot.name === nextSnapshot.name && baseSnapshot.description === nextSnapshot.description;

    // 現在の入力値が初期値と完全に一致している場合
    if (isMapOrTimeEqualInitial && isMetaEqualInitial) {
      setPointer(0);
      methods.setValue("mapDataCheck", 0, { shouldDirty: true });
      methods.setValue("metaDataCheck", 0, { shouldDirty: true });
    }
  }, [history, getCurrentSnapshot, methods, setPointer]);

  return {
    canUndo: pointer > 0,
    canRedo: pointer < history.length - 1,
    handleUndo,
    handleRedo,
    pushHistory,
    getCurrentSnapshot,
    setHistory,
    checkAndResetIfInitial,
  };
}
