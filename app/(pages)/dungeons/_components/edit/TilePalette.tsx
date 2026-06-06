import { useState } from "react";
import { TILE_CONFIG, TileConfigKey } from "@/types";
import { TileIconForm } from "./TileIconForm";
import { ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  selectedTile: string;
  onSelect: (id: string) => void;
  defaultOpen?: boolean;
};

export const TilePalette = ({ selectedTile, onSelect, defaultOpen = true }: Props) => {
  // 開閉状態を管理するステート（初期状態は開いた状態）
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 transition-all duration-300">
      {/* ヘッダー部分をクリックしても開閉できるように調整 */}
      <div
        className="flex items-center justify-between cursor-pointer group mb-2 select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors uppercase tracking-wider">
          Palettes
        </h2>
        <button
          type="button"
          className="text-gray-500 group-hover:text-white p-1 hover:bg-gray-800 rounded transition-colors"
          aria-label={isOpen ? "パレットを最小化" : "パレットを展開"}
        >
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(TILE_CONFIG).map((id) => (
              <button
                type="button"
                key={id}
                onClick={() => onSelect(id)}
                className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  selectedTile === id
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-transparent bg-gray-800 hover:bg-gray-700"
                }`}
              >
                <TileIconForm tileId={id} size={32} />
                <span className="text-[8px] truncate w-full text-center opacity-70">
                  {TILE_CONFIG[id as TileConfigKey]?.name}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => onSelect("..")}
              className="p-2 bg-red-900/20 rounded-lg text-[8px] hover:bg-red-900/40 flex items-center justify-center text-red-400 font-bold"
            >
              ERASER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
