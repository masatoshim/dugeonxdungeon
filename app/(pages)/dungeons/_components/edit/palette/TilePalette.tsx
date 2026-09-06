"use client";

import { useState, useEffect, useRef } from "react";
import { TILE_CONFIG, TILE_PALETTE_SCHEMA, TileConfigKey } from "@/game-core/master";
import { TileIconForm } from "./TileIconForm";
import { TILE_SIZE } from "@/game-core/types";
import { Eraser, X, ChevronUp, ChevronDown } from "lucide-react";

type Props = {
  selectedTile: TileConfigKey | null;
  isEditMode?: boolean;
  onSelect: (id: TileConfigKey) => void;
  onHoverChange?: (isHovered: boolean) => void;
  isMetadataOpen?: boolean;
};

export const TilePalette = ({ selectedTile, isEditMode, onSelect, onHoverChange, isMetadataOpen = false }: Props) => {
  const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(isEditMode ? null : 0);
  const [hoveredIdx, setHoveredIdx] = useState<number | "eraser" | null>(null);

  // パネル全体の開閉ステート
  const [isContentOpen, setIsContentOpen] = useState<boolean>(true);
  // subGroupごとの折りたたみステート
  const [collapsedSubGroups, setCollapsedSubGroups] = useState<Record<number, boolean>>({});

  // 左バーの画面上Y位置を追従するための参照とState
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelTop, setPanelTop] = useState<number>(0);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; label: string } | null>(null);

  // メタデータパネル開閉時にパレットを閉じる処理
  useEffect(() => {
    if (isMetadataOpen) {
      setActiveGroupIdx(null);
    }
  }, [isMetadataOpen]);

  // パレットのグループ切り替え / 閉じた時のフック
  const handleGroupClick = (idx: number) => {
    const isSelectedGroup = activeGroupIdx === idx;
    if (isSelectedGroup) {
      // 選択中のグループを閉じる場合 -> タイル選択も解除
      setActiveGroupIdx(null);
      onSelect(null as any);
    } else {
      // 別のグループに切り替える場合 -> タイル選択を一度解除
      setActiveGroupIdx(idx);
      setIsContentOpen(true);
      setCollapsedSubGroups({});
      onSelect(null as any);
    }
  };

  // subGroupの開閉切り替え
  const toggleSubGroup = (subIdx: number) => {
    setCollapsedSubGroups((prev) => ({
      ...prev,
      [subIdx]: !prev[subIdx],
    }));
  };

  // パレット内の閉じるボタンクリック時
  const handleClosePanel = () => {
    setActiveGroupIdx(null);
    onSelect(null as any);
  };

  // ヘッダー開閉等のレイアウト変更に伴うY座標変更
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updatePosition = () => {
      const rect = el.getBoundingClientRect();
      setPanelTop(rect.top);
    };

    updatePosition();

    // ヘッダー開閉のアニメーション完了ラグに備えて1フレーム後にも更新
    const rafId = requestAnimationFrame(updatePosition);

    // 画面リサイズ監視
    window.addEventListener("resize", updatePosition);

    // ヘッダーなどのDOM要素の高さ変更を監視
    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });

    // アコーディオン等の開閉を直接検知
    const mutationObserver = new MutationObserver(() => {
      updatePosition();
    });

    if (document.body) {
      resizeObserver.observe(document.body);
      mutationObserver.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePosition);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [activeGroupIdx]);

  // 表示対象のグループ（選択中のグループ）
  const currentGroup = activeGroupIdx !== null ? TILE_PALETTE_SCHEMA[activeGroupIdx] : null;

  // 最小のY開始座標
  const computedTop = Math.max(panelTop, 64);

  // ホバー位置のY座標計算
  const handleMouseEnterButton = (e: React.MouseEvent<HTMLButtonElement>, label: string, key: number | "eraser") => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ top: rect.top + rect.height / 2, label });
    setHoveredIdx(key);
  };

  const handleMouseLeaveButton = () => {
    setTooltipPos(null);
    setHoveredIdx(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-start z-[60] select-none"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => {
        handleMouseLeaveButton();
        onHoverChange?.(false);
      }}
    >
      {/* ─── サブグループ & タイルパネル ─── */}
      {!isMetadataOpen && currentGroup && (
        <div
          className="fixed left-[calc(1rem+3.5rem)] w-72 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3 animate-in fade-in slide-in-from-left-2 duration-150 z-50 transition-[top] duration-100 ease-out overflow-hidden"
          style={{
            top: `${computedTop}px`,
            maxHeight: `calc(100vh - ${computedTop}px - 1.5rem)`,
          }}
        >
          {/* 固定ヘッダー */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{currentGroup.label}</h3>

            <div className="flex items-center gap-1">
              {/* 全体 最小化 / 展開 ボタン */}
              <button
                type="button"
                onClick={() => setIsContentOpen((prev) => !prev)}
                className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label={isContentOpen ? "パネル全体を最小化" : "パネル全体を展開"}
              >
                {isContentOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* 閉じる ボタン */}
              <button
                type="button"
                onClick={handleClosePanel}
                className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="パネルを閉じる"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* 展開/最小化 */}
          <div
            className={`grid transition-all duration-200 ease-in-out min-h-0 flex-1 ${
              isContentOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
            }`}
          >
            {/* スクロール可能エリア */}
            <div className="overflow-hidden h-full flex flex-col">
              <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar min-h-0 flex-1 pr-1 pt-1">
                {currentGroup.subGroups.map((subGroup, subIdx) => {
                  const hasMultipleSubGroups = currentGroup.subGroups.length > 1;
                  const isSubCollapsed = hasMultipleSubGroups && !!collapsedSubGroups[subIdx];

                  return (
                    <div
                      key={subIdx}
                      className="flex flex-col gap-1.5 border-b border-slate-800/40 pb-2 last:border-none last:pb-0"
                    >
                      {/* subGroupが2つ以上ある場合、ヘッダーを表示 */}
                      {hasMultipleSubGroups ? (
                        <button
                          type="button"
                          onClick={() => toggleSubGroup(subIdx)}
                          className="flex items-center justify-between w-full py-1 px-1 -mx-1 rounded-md hover:bg-slate-800/50 transition-colors text-left group/sub"
                        >
                          <span className="text-[10px] font-semibold text-slate-400 group-hover/sub:text-slate-200 tracking-wider">
                            {subGroup.subLabel}
                          </span>
                          <span className="text-slate-500 group-hover/sub:text-slate-300">
                            {isSubCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                          </span>
                        </button>
                      ) : subGroup.subLabel ? (
                        <span className="text-[10px] font-semibold text-slate-500 tracking-wider py-0.5">
                          {subGroup.subLabel}
                        </span>
                      ) : null}

                      {/* SubGroup内グリッド */}
                      <div
                        className={`grid transition-all duration-200 ease-in-out ${
                          !isSubCollapsed
                            ? "grid-rows-[1fr] opacity-100 mt-1"
                            : "grid-rows-[0fr] opacity-0 pointer-events-none"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="grid grid-cols-3 gap-2">
                            {subGroup.items.map((item) => {
                              if (item.isEraser) return null;
                              const tile = TILE_CONFIG[item.id];
                              if (!tile) return null;

                              const isSelected = selectedTile === item.id;

                              return (
                                <button
                                  type="button"
                                  key={item.id}
                                  onClick={() => onSelect(item.id)}
                                  className={`p-1.5 py-2 rounded-xl border transition-all duration-150 flex flex-col items-center justify-between min-h-[4.5rem] relative group/tile ${
                                    isSelected
                                      ? "border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-md shadow-cyan-950/50"
                                      : "border-slate-800/80 bg-slate-800/30 hover:bg-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  <div className="shrink-0 p-0.5 rounded bg-black/20 border border-black/10 group-hover/tile:border-black/30 transition-colors">
                                    <TileIconForm tileId={item.id} size={TILE_SIZE} />
                                  </div>

                                  <span className="text-[9px] font-medium leading-[1.1] text-center tracking-tighter opacity-90 group-hover/tile:opacity-100 mt-1 line-clamp-2 break-all w-full min-h-[20px] flex items-center justify-center">
                                    {tile.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 全体ヘッダー ─── */}
      <div className="flex flex-col gap-2 p-1.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-md shrink-0 w-12 z-10">
        {/* 消しゴムボタン */}
        <button
          type="button"
          onClick={() => {
            onSelect(" ");
            setActiveGroupIdx(null);
          }}
          onMouseEnter={(e) => handleMouseEnterButton(e, "消しゴム", "eraser")}
          onMouseLeave={handleMouseLeaveButton}
          className={`w-9 h-9 rounded-xl transition-all duration-150 border flex items-center justify-center relative group ${
            selectedTile === " "
              ? "border-red-500/80 bg-red-950/60 text-red-400 shadow-lg shadow-red-950/50"
              : "border-slate-800/80 bg-slate-800/40 text-slate-400 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/50"
          }`}
        >
          <Eraser size={18} />
        </button>

        <div className="w-full h-px bg-slate-800/80 my-0.5" />

        {/* 大グループアイコン一覧 */}
        {TILE_PALETTE_SCHEMA.map((group, idx) => {
          const isSelectedGroup = activeGroupIdx === idx;
          const IconComponent = group.icon;

          return (
            <button
              type="button"
              key={idx}
              onClick={() => handleGroupClick(idx)}
              onMouseEnter={(e) => handleMouseEnterButton(e, group.label, idx)}
              onMouseLeave={handleMouseLeaveButton}
              className={`w-9 h-9 rounded-xl transition-all duration-150 border flex items-center justify-center relative group ${
                isSelectedGroup
                  ? "border-cyan-500 bg-cyan-950/50 text-cyan-300 shadow-md shadow-cyan-950/40"
                  : "border-slate-800/80 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <IconComponent size={18} />

              {isSelectedGroup && (
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-cyan-400 rounded-r-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── ツールチップ ─── */}
      {tooltipPos && (
        <div
          className="fixed left-[calc(1rem+3.5rem)] px-2 py-1 bg-slate-900 text-xs text-slate-200 border border-slate-800 rounded-md whitespace-nowrap -translate-y-1/2 pointer-events-none shadow-lg z-[100]"
          style={{ top: `${tooltipPos.top}px` }}
        >
          {tooltipPos.label}
        </div>
      )}
    </div>
  );
};
