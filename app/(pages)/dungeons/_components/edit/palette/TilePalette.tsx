import { useState } from "react";
import { TILE_CONFIG, TILE_PALETTE_SCHEMA } from "@/game-core/master";
import { TileConfigKey } from "@/game-core/master";
import { TileIconForm } from "./TileIconForm";
import { TILE_SIZE } from "@/game-core/types";
import { ChevronDown, Eraser, Play } from "lucide-react";

type Props = {
  selectedTile: TileConfigKey;
  onSelect: (id: TileConfigKey) => void;
  defaultOpen?: boolean;
};

export const TilePalette = ({ selectedTile, onSelect, defaultOpen = true }: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-900/95 border border-slate-800/80 rounded-xl p-4 shadow-2xl shadow-black/40 backdrop-blur-sm transition-all duration-300 w-full flex flex-col gap-3">
      {/* 全体ヘッダー部分 */}
      <div className="flex items-center justify-between select-none">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Palettes</h2>

        <div className="flex items-center gap-2">
          {/* 消しゴムボタン */}
          <button
            type="button"
            onClick={() => onSelect(" ")}
            title="消しゴム (ERASER)"
            className={`p-1.5 rounded-md transition-all duration-150 border flex items-center justify-center ${
              selectedTile === " "
                ? "border-red-500/80 bg-red-950/40 text-red-400 shadow-sm shadow-red-950"
                : "border-red-950/60 bg-red-950/10 text-red-900/80 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/50"
            }`}
          >
            <Eraser size={16} />
          </button>

          {/* コンポーネント全体の最小化 */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-500 hover:text-slate-200 p-1 hover:bg-slate-800/60 rounded-md transition-all"
            aria-label={isOpen ? "パレットを最小化" : "パレットを展開"}
          >
            <ChevronDown
              size={16}
              className={`transform transition-transform duration-200 ease-in-out ${isOpen ? "rotate-180 text-slate-300" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* 全体のアニメーションラッパー */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0"
        }`}
      >
        <div className="overflow-hidden flex flex-col gap-3.5">
          {TILE_PALETTE_SCHEMA.map((group, groupIdx) => (
            <PaletteGroupSection key={groupIdx} group={group} selectedTile={selectedTile} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
};

// 大グループコンポーネント
const PaletteGroupSection = ({
  group,
  selectedTile,
  onSelect,
}: {
  group: (typeof TILE_PALETTE_SCHEMA)[number];
  selectedTile: TileConfigKey;
  onSelect: (id: TileConfigKey) => void;
}) => {
  const [isGroupOpen, setIsGroupOpen] = useState(true);

  return (
    <div className="border-b border-slate-800/50 pb-3 last:border-none last:pb-0">
      {/* 大グループヘッダー */}
      <div
        className="flex items-center justify-between cursor-pointer group/group-header select-none py-1"
        onClick={() => setIsGroupOpen(!isGroupOpen)}
      >
        <div className="flex items-center gap-2">
          <Play
            size={8}
            className={`fill-slate-600 text-slate-600 group-hover/group-header:fill-slate-400 group-hover/group-header:text-slate-400 transform transition-transform duration-150 ease-out ${
              isGroupOpen ? "rotate-90" : "rotate-0"
            }`}
          />
          <h3 className="text-[10px] font-bold text-slate-500 group-hover/group-header:text-slate-300 uppercase tracking-widest transition-colors">
            {group.label}
          </h3>
        </div>
      </div>

      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isGroupOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3">
            {group.subGroups.map((subGroup, subIdx) => (
              <PaletteSubGroupSection
                key={subIdx}
                subGroup={subGroup}
                selectedTile={selectedTile}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 小グループ（サブグループ）コンポーネント
const PaletteSubGroupSection = ({
  subGroup,
  selectedTile,
  onSelect,
}: {
  subGroup: (typeof TILE_PALETTE_SCHEMA)[number]["subGroups"][number];
  selectedTile: string;
  onSelect: (id: TileConfigKey) => void;
}) => {
  const [isSubOpen, setIsSubOpen] = useState(true);
  const hasSubLabel = !!subGroup.subLabel;

  return (
    <div
      className={`flex flex-col transition-all ${
        hasSubLabel
          ? "bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 w-full shadow-inner shadow-black/10"
          : ""
      }`}
    >
      {/* 小グループ名 */}
      {hasSubLabel && (
        <div
          className="flex items-center justify-between cursor-pointer group/sub-header select-none pb-1.5"
          onClick={() => setIsSubOpen(!isSubOpen)}
        >
          <div className="flex items-center gap-1.5">
            <Play
              size={7}
              className={`fill-slate-600 text-slate-600 group-hover/sub-header:fill-slate-400 group-hover/sub-header:text-slate-400 transform transition-transform duration-150 ease-out ${
                isSubOpen ? "rotate-90" : "rotate-0"
              }`}
            />
            <span className="text-[9px] font-bold text-slate-500 group-hover/sub-header:text-slate-300 tracking-wide transition-colors">
              {subGroup.subLabel}
            </span>
          </div>
        </div>
      )}

      {/* 小グループ内のタイル一覧用アニメーションラッパー */}
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          !hasSubLabel || isSubOpen
            ? "grid-rows-[1fr] opacity-100 mt-0.5"
            : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-2 items-start justify-start">
            {subGroup.items.map((item) => {
              if (item.isEraser) return null;
              const tile = TILE_CONFIG[item.id];
              if (!tile) return null;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`p-1.5 rounded-lg border transition-all duration-150 flex flex-col items-center justify-center gap-1 min-h-[60px] w-[calc((100%-16px)/3)] min-w-[54px] max-w-[68px] relative group/tile select-none ${
                    selectedTile === item.id
                      ? "border-cyan-500 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-950/50"
                      : "border-slate-800/80 bg-slate-800/40 hover:bg-slate-700/50 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="shrink-0 p-0.5 rounded bg-black/20 border border-black/10 group-hover/tile:border-black/30 transition-colors">
                    <TileIconForm tileId={item.id} size={TILE_SIZE} />
                  </div>

                  <span className="text-[9px] font-medium truncate w-full text-center tracking-tight leading-none opacity-90 group-hover/tile:opacity-100 transition-opacity">
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
};
