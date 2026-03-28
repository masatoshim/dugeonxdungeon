import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DUNGEON_DEFAULT, TILE_CONFIG, EntityData, TileConfigKey, TILE_CATEGORIES } from "@/types";
import { TileIconForm, EditorHeader, TilePalette } from "@/app/dungeons/_components";
import { toast } from "sonner";

// セット設置の状態管理
type LinkingState = {
  active: boolean;
  mode: "KEY_DOOR" | "BUTTON_DOOR" | null; // 何のセットを設置中か
  pendingType: "KEY" | "DOOR" | "BUTTON" | null; // 次に設置すべきタイプ
  firstEntityId: string | null;
};

export function DungeonEditor({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  // 各項目を初期化
  const [rows, setRows] = useState<number>(DUNGEON_DEFAULT.ROWS);
  const [cols, setCols] = useState<number>(DUNGEON_DEFAULT.COLS);
  const [config, setConfig] = useState({
    name: "",
    description: "",
    timeLimit: DUNGEON_DEFAULT.TIME_LIMIT,
  });

  // マップ情報を初期化
  const [tiles, setTiles] = useState<string[][]>(() => {
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

  const [selectedTile, setSelectedTile] = useState("W");
  const [entities, setEntities] = useState<EntityData[]>([]);

  const [linkingState, setLinkingState] = useState<LinkingState>({
    active: false,
    mode: null,
    pendingType: null,
    firstEntityId: null,
  });

  const currentTileConfig = useMemo(() => TILE_CONFIG[selectedTile as TileConfigKey], [selectedTile]);

  /**
   * ダンジョンサイズ変更
   */
  const updateTilesSize = (newRows: number, newCols: number) => {
    setTiles((prev) => {
      const oldRows = prev.length;
      const oldCols = prev[0].length;
      // すべて床の新しい配列を作成
      const nextTiles = Array(newRows)
        .fill(0)
        .map(() => Array(newCols).fill(".."));
      // 既存のデータをコピー（外周の壁以外）
      for (let r = 0; r < newRows; r++) {
        for (let c = 0; c < newCols; c++) {
          // 範囲内かつ、元の場所が外周でなかったものだけをコピー
          if (r < oldRows && c < oldCols) {
            const isOldEdge = r === 0 || r === oldRows - 1 || c === 0 || c === oldCols - 1;
            if (!isOldEdge) {
              nextTiles[r][c] = prev[r][c];
            }
          }
        }
      }
      // 新しい外周を壁で上書き
      for (let r = 0; r < newRows; r++) {
        for (let c = 0; c < newCols; c++) {
          if (r === 0 || r === newRows - 1 || c === 0 || c === newCols - 1) {
            nextTiles[r][c] = "W";
          }
        }
      }
      return nextTiles;
    });
    setEntities((prev) => prev.filter((e) => e.x < newCols - 1 && e.y < newRows - 1));
  };

  /**
   * 設置しようとしているタイルがどのエンティティタイプかを判定
   */
  const getEntityType = (tileId: string): "KEY" | "DOOR" | "BUTTON" | null => {
    if (tileId.startsWith("K1")) return "KEY";
    if (tileId.startsWith("KD1")) return "DOOR"; // 鍵扉
    if (tileId.startsWith("B1")) return "BUTTON";
    if (tileId.startsWith("D1")) return "DOOR"; // ボタン扉
    return null;
  };

  /**
   * セルクリック時のバリデーションと設置ロジック
   */
  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) return;

      const isEraser = selectedTile === "..";
      const category = currentTileConfig?.category;
      const isGimmick = category === TILE_CATEGORIES.GIMMICK;
      const incomingType = getEntityType(selectedTile);

      // --- 1. セット設置中のバリデーション ---
      if (linkingState.active && !isEraser) {
        if (!isGimmick || incomingType !== linkingState.pendingType) {
          const targetName =
            linkingState.pendingType === "DOOR" ? "扉" : linkingState.pendingType === "KEY" ? "鍵" : "ボタン";
          toast.error(`セット設置中です。対になる「${targetName}」を設置してください。`);
          return;
        }
      }

      // --- 2. プレイヤー単一設置バリデーション ---
      if (category === TILE_CATEGORIES.PLAYER) {
        const hasPlayer = tiles
          .flat()
          .some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.PLAYER);
        if (hasPlayer) return toast.error("プレイヤーは1つしか設置できません。");
      }

      // --- 3. ステート更新 ---
      const newId = `${selectedTile}_${crypto.randomUUID().slice(0, 8)}`;

      setTiles((prev) => {
        const next = [...prev];
        next[r] = [...next[r]];
        next[r][c] = isGimmick ? ".." : selectedTile;
        return next;
      });

      setEntities((prev) => {
        const filtered = prev.filter((e) => !(e.x === c && e.y === r));
        if (isEraser) return filtered;

        if (isGimmick && incomingType) {
          const newEntity: EntityData = {
            id: newId,
            type: incomingType,
            x: c,
            y: r,
            properties: {
              tileId: selectedTile,
            },
          };

          if (!linkingState.active) {
            // 1つ目の設置
            const mode = incomingType === "KEY" || selectedTile === "KD1" ? "KEY_DOOR" : "BUTTON_DOOR";
            const pendingType = incomingType === "DOOR" ? (mode === "KEY_DOOR" ? "KEY" : "BUTTON") : "DOOR";

            setLinkingState({ active: true, mode, pendingType, firstEntityId: newId });
            return [...filtered, newEntity];
          } else {
            // 2つ目の設置（ペア確定）
            const firstId = linkingState.firstEntityId;
            setLinkingState({ active: false, mode: null, pendingType: null, firstEntityId: null });

            // 既存の entities を map で回し、1つ目の entity に targetId を付与
            const updatedPrev = filtered.map((e): EntityData => {
              if (e.id === firstId) {
                return {
                  ...e,
                  properties: { ...e.properties, targetId: newId },
                };
              }
              return e;
            });

            // 2つ目の entity にも targetId を付与して追加
            const completedSecondEntity: EntityData = {
              ...newEntity,
              properties: { ...newEntity.properties, targetId: firstId ?? undefined }, // nullを避けてundefinedを渡す
            };

            return [...updatedPrev, completedSecondEntity];
          }
        }
        return filtered;
      });
    },
    [rows, cols, selectedTile, currentTileConfig, linkingState, tiles],
  );

  /**
   * 保存処理
   */
  const handleSave = async (status: "DRAFT" | "PUBLISHED") => {
    if (!config.name) return alert("ダンジョン名を入力してください");
    if (linkingState.active) return alert("セット設置を完了させてください（扉またはスイッチが不足しています）");

    const flatTiles = tiles.flat();
    if (!flatTiles.some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.PLAYER))
      return alert("プレイヤーを設置してください");
    if (!flatTiles.some((t) => TILE_CONFIG[t as TileConfigKey]?.category === TILE_CATEGORIES.GOAL))
      return alert("ゴールを設置してください");

    const payload = {
      ...config,
      status,
      mapData: {
        tiles: tiles.map((row) => row.map((c) => (c === ".." ? " " : c))),
        entities,
        width: cols,
        height: rows,
      },
    };

    try {
      const res = await fetch("/api/dungeons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) router.push("/");
    } catch (e) {
      console.log(`error:${e}`);
      alert("保存に失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <EditorHeader
          cols={cols}
          rows={rows}
          config={config}
          onConfigChange={(k, v) => setConfig((prev) => ({ ...prev, [k]: v }))}
          onSizeChange={(r, c) => {
            setRows(r);
            setCols(c);
            updateTilesSize(r, c);
          }}
          onSave={handleSave}
        />

        <div className="flex gap-6 mt-6">
          <div className="w-64 flex-shrink-0 space-y-4">
            <TilePalette
              selectedTile={selectedTile}
              onSelect={(id) => {
                if (id === "..") return setSelectedTile(id);
                if (linkingState.active) {
                  const type = getEntityType(id);
                  if (type !== linkingState.pendingType) {
                    return alert(`セット設置モード中です。対応するパーツを選択してください。`);
                  }
                }
                setSelectedTile(id);
              }}
            />

            {linkingState.active && (
              <div className="bg-amber-900/40 border border-amber-500 p-4 rounded-xl animate-pulse">
                <p className="text-xs text-amber-400 font-bold uppercase">Linking Mode</p>
                <p className="text-sm">
                  {linkingState.pendingType === "DOOR" ? "扉" : linkingState.pendingType === "KEY" ? "鍵" : "ボタン"}{" "}
                  を配置してください
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-auto p-12 min-h-[600px] flex">
            <div
              className="inline-grid gap-0 shadow-2xl ring-4 ring-black bg-gray-800 m-auto"
              style={{ gridTemplateColumns: `repeat(${cols}, 32px)` }}
            >
              {tiles.map((row, r) =>
                row.map((cell, c) => {
                  const entityAtPos = entities.find((e) => e.x === c && e.y === r);
                  const isPendingFirst = entityAtPos?.id === linkingState.firstEntityId;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onMouseDown={() => handleCellClick(r, c)}
                      onMouseEnter={(e) => e.buttons === 1 && handleCellClick(r, c)}
                      className={`w-8 h-8 border-[0.1px] border-white/5 relative box-border transition-colors hover:bg-white/10 cursor-crosshair
                        ${isPendingFirst ? "ring-2 ring-inset ring-amber-500 bg-amber-500/20" : ""}
                        ${entityAtPos && !isPendingFirst ? "ring-1 ring-inset ring-white/20" : ""}
                      `}
                    >
                      <TileIconForm tileId={cell} size={32} />
                      {entityAtPos && (
                        <div className="absolute inset-0 pointer-events-none">
                          <TileIconForm tileId={entityAtPos.properties?.tileId || ""} size={32} />
                        </div>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
