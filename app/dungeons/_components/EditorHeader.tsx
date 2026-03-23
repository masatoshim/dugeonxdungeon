type Props = {
  cols: number;
  rows: number;
  config: {
    name: string;
    description: string;
    timeLimit: number;
  };
  onConfigChange: (key: string, value: string | number) => void;
  onSizeChange: (r: number, c: number) => void;
  onSave: (status: "DRAFT" | "PUBLISHED") => void;
};

export const EditorHeader = ({ cols, rows, config, onConfigChange, onSizeChange, onSave }: Props) => (
  <div className="bg-gray-900 border-b border-gray-800 p-4 mb-6 rounded-xl">
    <div className="flex flex-wrap gap-4 items-end justify-between">
      {/* 基本情報入力 */}
      <div className="flex flex-wrap gap-4 flex-1">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 font-bold uppercase">Dungeon Name</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => onConfigChange("name", e.target.value)}
            placeholder="ダンジョン名"
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:ring-1 ring-yellow-500 outline-none w-64"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 font-bold uppercase">Time Limit (sec)</label>
          <input
            type="number"
            value={config.timeLimit}
            onChange={(e) => onConfigChange("timeLimit", parseInt(e.target.value) || 0)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm w-24 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px] text-gray-500 font-bold uppercase">Description</label>
          <input
            type="text"
            value={config.description}
            onChange={(e) => onConfigChange("description", e.target.value)}
            placeholder="ダンジョンの説明文..."
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm outline-none"
          />
        </div>
      </div>

      {/* サイズとボタン */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded border border-gray-800">
          <input
            type="number"
            value={cols}
            onChange={(e) => onSizeChange(rows, parseInt(e.target.value))}
            className="w-10 bg-transparent text-center text-xs"
          />
          <span className="text-gray-600">×</span>
          <input
            type="number"
            value={rows}
            onChange={(e) => onSizeChange(parseInt(e.target.value), cols)}
            className="w-10 bg-transparent text-center text-xs"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave("DRAFT")}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold transition-colors"
          >
            下書き保存
          </button>
          <button
            onClick={() => onSave("PUBLISHED")}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-xs font-bold shadow-lg shadow-yellow-900/20 transition-all"
          >
            公開する
          </button>
        </div>
      </div>
    </div>
  </div>
);
