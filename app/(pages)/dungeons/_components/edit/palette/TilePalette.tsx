"use client";

import { useState, useEffect, useRef } from "react";
import { TILE_CONFIG, TILE_PALETTE_SCHEMA, TileConfigKey } from "@/game-core/master";
import { TileIconForm } from "./TileIconForm";
import { TILE_SIZE } from "@/game-core/types";
import { Eraser, User, ShieldAlert, Sparkles, Layers, X } from "lucide-react";

type Props = {
  selectedTile: TileConfigKey;
  onSelect: (id: TileConfigKey) => void;
  onHoverChange?: (isHovered: boolean) => void;
  isMetadataOpen?: boolean;
};

// 大グループごとのアイコンマッピング
const GROUP_ICONS: Record<string, React.ReactNode> = {
  プレイヤーとゴール: <User size={18} />,
  壁: <ShieldAlert size={18} />,
  ギミック: <Sparkles size={18} />,
};

export const TilePalette = ({ selectedTile, onSelect, onHoverChange, isMetadataOpen = false }: Props) => {
  const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(0);
  const [hoveredGroupIdx, setHoveredGroupIdx] = useState<number | null>(null);

  // 左バーの画面上Y位置を追従するための参照とState
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelTop, setPanelTop] = useState<number>(0);

  // メタデータパネル開閉時のリセット
  useEffect(() => {
    if (isMetadataOpen) {
      setActiveGroupIdx(null);
      setHoveredGroupIdx(null);
    }
  }, [isMetadataOpen]);

  // 左バーの画面上Y座標を取得してパネル上端を合わせる
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPanelTop(rect.top);
    }
  }, [activeGroupIdx, hoveredGroupIdx]);

  // 表示対象のグループ（ホバー優先、なければ選択中のグループ）
  const currentGroupIdx = hoveredGroupIdx !== null ? hoveredGroupIdx : activeGroupIdx;
  const currentGroup = currentGroupIdx !== null ? TILE_PALETTE_SCHEMA[currentGroupIdx] : null;

  return (
    <div
      ref={containerRef}
      className="relative flex items-start z-30 select-none"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => {
        setHoveredGroupIdx(null);
        onHoverChange?.(false);
      }}
    >
      {/* 全体ヘッダー部分 */}
      <div className="flex flex-col gap-2 p-1.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-md shrink-0 w-12">
        {/* 消しゴムボタン */}
        <button
          type="button"
          onClick={() => {
            onSelect(" ");
            setActiveGroupIdx(null);
          }}
          title="消しゴム (ERASER)"
          className={`w-9 h-9 rounded-xl transition-all duration-150 border flex items-center justify-center relative group ${
            selectedTile === " "
              ? "border-red-500/80 bg-red-950/60 text-red-400 shadow-lg shadow-red-950/50"
              : "border-slate-800/80 bg-slate-800/40 text-slate-400 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/50"
          }`}
        >
          <Eraser size={18} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-xs text-slate-200 border border-slate-800 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
            消しゴム
          </span>
        </button>

        <div className="w-full h-px bg-slate-800/80 my-0.5" />

        {/* 大グループアイコン一覧 */}
        {TILE_PALETTE_SCHEMA.map((group, idx) => {
          const isActive = currentGroupIdx === idx;
          const isSelectedGroup = activeGroupIdx === idx;
          const icon = GROUP_ICONS[group.label] || <Layers size={18} />;

          return (
            <button
              type="button"
              key={idx}
              onClick={() => setActiveGroupIdx(idx)}
              onMouseEnter={() => setHoveredGroupIdx(idx)}
              className={`w-9 h-9 rounded-xl transition-all duration-150 border flex items-center justify-center relative group ${
                isActive || isSelectedGroup
                  ? "border-cyan-500 bg-cyan-950/50 text-cyan-300 shadow-md shadow-cyan-950/40"
                  : "border-slate-800/80 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {icon}

              {isSelectedGroup && (
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-cyan-400 rounded-r-full" />
              )}

              <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-xs text-slate-200 border border-slate-800 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                {group.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── サブグループ & タイルパネル ─── */}
      {!isMetadataOpen && currentGroup && (
        <div
          className="fixed left-[calc(1rem+3.5rem)] w-72 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3 animate-in fade-in slide-in-from-left-2 duration-150 z-50 h-auto"
          style={{
            top: `${panelTop}px`,
            maxHeight: `calc(100vh - ${panelTop}px - 2.0rem)`,
          }}
          onMouseEnter={() => {
            if (hoveredGroupIdx !== null) setHoveredGroupIdx(hoveredGroupIdx);
          }}
        >
          {/* 固定ヘッダー */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{currentGroup.label}</h3>

            <button
              type="button"
              onClick={() => {
                setActiveGroupIdx(null);
                setHoveredGroupIdx(null);
              }}
              className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* スクロール可能エリア */}
          <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar min-h-0 pr-1">
            {currentGroup.subGroups.map((subGroup, subIdx) => (
              <div key={subIdx} className="flex flex-col gap-2">
                {subGroup.subLabel && (
                  <span className="text-[10px] font-semibold text-slate-500 tracking-wider">{subGroup.subLabel}</span>
                )}

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
                        onClick={() => {
                          onSelect(item.id);
                          setHoveredGroupIdx(null);
                        }}
                        className={`p-2 rounded-xl border transition-all duration-150 flex flex-col items-center justify-center gap-1.5 h-16 relative group/tile ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-md shadow-cyan-950/50"
                            : "border-slate-800/80 bg-slate-800/30 hover:bg-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="shrink-0 p-0.5 rounded bg-black/20 border border-black/10 group-hover/tile:border-black/30 transition-colors">
                          <TileIconForm tileId={item.id} size={TILE_SIZE} />
                        </div>

                        <span className="text-[9px] font-medium truncate w-full text-center tracking-tight leading-none opacity-90 group-hover/tile:opacity-100">
                          {tile.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
