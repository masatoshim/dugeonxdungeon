import { TILE_CONFIG, TileConfigKey } from "@/types";
import { TileIconForm } from "./TileIconForm";

type Props = {
  selectedTile: string;
  onSelect: (id: string) => void;
};

export const TilePalette = ({ selectedTile, onSelect }: Props) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
    <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase">Palettes</h2>
    <div className="grid grid-cols-3 gap-2">
      {Object.keys(TILE_CONFIG).map((id) => (
        <button
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
      <button onClick={() => onSelect("..")} className="p-2 bg-red-900/20 rounded-lg text-[8px] hover:bg-red-900/40">
        ERASER
      </button>
    </div>
  </div>
);
