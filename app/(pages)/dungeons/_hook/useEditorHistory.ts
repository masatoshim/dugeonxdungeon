import { useState, useCallback, useRef, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { EntityData } from "@/types";

export interface EditorSnapshot {
  name: string;
  description: string;
  timeLimit: number;
  tiles: string[][];
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
  setTilesState: (t: string[][]) => void,
  setEntitiesState: (e: EntityData[]) => void,
) {
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [pointer, setPointer] = useState(-1);
  const isApplyingHistory = useRef(false);

  // 現在の状態を取得
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

  // 初期化：マップデータが読み込まれたら、最初の状態（0番目）をスタックに積む
  useEffect(() => {
    if (tiles.length > 0 && history.length === 0) {
      setHistory([getCurrentSnapshot()]);
      setPointer(0);
    }
  }, [tiles, history.length, getCurrentSnapshot]);

  // サイズ変更（rows, cols）を検知して自動で履歴を積む（1番目以降）
  useEffect(() => {
    // 履歴が空、またはポインターが初期値の場合は、初期化を待つため除外
    if (history.length === 0 || pointer < 0) return;

    const lastSnapshot = history[pointer];
    // 現在の画面のサイズが、履歴スタックの最新のサイズと異なる場合のみ実行
    if (lastSnapshot && (lastSnapshot.rows !== rows || lastSnapshot.cols !== cols)) {
      const currentSnap = getCurrentSnapshot();

      setHistory((prev) => [...prev.slice(0, pointer + 1), currentSnap]);
      setPointer((prev) => prev + 1);
    }
  }, [rows, cols, getCurrentSnapshot, history, pointer]);

  const isPushing = useRef(false);
  // 履歴を積む
  const pushHistory = useCallback(
    (customSnapshot?: EditorSnapshot) => {
      if (isApplyingHistory.current || isPushing.current) return;

      const nextSnapshot = customSnapshot ?? getCurrentSnapshot();

      // 同一データの連続保存を防ぐチェック
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
          // すべての状態が直前と「完全に同じ」なら、重複して積まない
          return;
        }
      }

      isPushing.current = true;
      setHistory((prev) => [...prev.slice(0, pointer + 1), nextSnapshot]);
      setPointer((prev) => prev + 1);

      setTimeout(() => {
        isPushing.current = false;
      }, 50);
    },
    [pointer, history, getCurrentSnapshot],
  );

  // 状態の適用
  const applySnapshot = useCallback(
    (snapshot: EditorSnapshot) => {
      isApplyingHistory.current = true;
      setRows(snapshot.rows);
      setCols(snapshot.cols);
      setTilesState(snapshot.tiles);
      setEntitiesState(snapshot.entities);

      methods.reset(
        {
          ...methods.getValues(),
          name: snapshot.name,
          description: snapshot.description,
          timeLimit: snapshot.timeLimit,
          mapDataCheck: `history-${Date.now()}`,
        },
        { keepDirty: true },
      );

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
      applySnapshot(history[next]);
    }
  }, [pointer, history, applySnapshot]);

  const handleRedo = useCallback(() => {
    if (pointer < history.length - 1) {
      const next = pointer + 1;
      setPointer(next);
      applySnapshot(history[next]);
    }
  }, [pointer, history, applySnapshot]);

  return {
    canUndo: pointer > 0,
    canRedo: pointer < history.length - 1,
    handleUndo,
    handleRedo,
    pushHistory,
    getCurrentSnapshot,
    setHistory, // 初期値の上書き用
  };
}
