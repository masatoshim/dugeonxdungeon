"use client";

import { useState } from "react";
import { Search, X, RotateCcw } from "lucide-react";

export interface DungeonFilterValues {
  text: string;
  difficultyList: number[];
  mapSizeWidthFrom: string;
  mapSizeWidthTo: string;
  mapSizeHeightFrom: string;
  mapSizeHeightTo: string;
  playStatusList: string[];
  isFavoritesList: string[];
}

interface DungeonSearchFilterModalProps {
  initialValues: DungeonFilterValues;
  // 検索ボタン押下時に、構築済みのクエリ文字列を親に渡す
  onSearch: (queryString: string) => void;
}

export function DungeonSearchFilterModal({ initialValues, onSearch }: DungeonSearchFilterModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<DungeonFilterValues>(initialValues);

  const handleReset = () => {
    setFilter({
      text: "",
      difficultyList: [],
      mapSizeWidthFrom: "",
      mapSizeWidthTo: "",
      mapSizeHeightFrom: "",
      mapSizeHeightTo: "",
      playStatusList: [],
      isFavoritesList: [],
    });
  };

  const handleSubmit = () => {
    // 検索コンポーネント内でURLSearchParamsを構築し、有効な値だけを設定する
    const params = new URLSearchParams();
    params.set("page", "1"); // 検索時は1ページ目に戻す

    if (filter.text && filter.text !== "undefined") {
      params.set("text", filter.text);
    }
    if (filter.difficultyList.length > 0) {
      params.set("difficultyList", filter.difficultyList.join(","));
    }
    if (filter.mapSizeWidthFrom) {
      params.set("mapSizeWidthFrom", filter.mapSizeWidthFrom);
    }
    if (filter.mapSizeWidthTo) {
      params.set("mapSizeWidthTo", filter.mapSizeWidthTo);
    }
    if (filter.mapSizeHeightFrom) {
      params.set("mapSizeHeightFrom", filter.mapSizeHeightFrom);
    }
    if (filter.mapSizeHeightTo) {
      params.set("mapSizeHeightTo", filter.mapSizeHeightTo);
    }
    if (filter.playStatusList.length > 0) {
      params.set("playStatusList", filter.playStatusList.join(","));
    }
    if (filter.isFavoritesList.length > 0) {
      params.set("isFavoritesList", filter.isFavoritesList.join(","));
    }

    // 親へクエリ文字列を渡す
    onSearch(params.toString());
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* 虫眼鏡アイコンボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 p-2.5 rounded-lg transition-colors cursor-pointer shadow-sm"
        title="絞り込み検索"
        aria-label="絞り込み検索"
      >
        <Search size={18} />
      </button>

      {/* モーダルオーバーレイ */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 max-w-lg w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-5 max-h-[90vh] flex flex-col text-xs">
            {/* ヘッダー */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Search size={18} className="text-[#4fd1d1]" />
                <h3 className="font-black text-sm uppercase tracking-wider">ダンジョン検索条件</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
                aria-label="閉じる"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              {/* フリーワード */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-300">キーワード</label>
                <input
                  type="text"
                  placeholder="ダンジョン名 / コード / 説明 / 作者ニックネーム"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-[#4fd1d1]"
                  value={filter.text}
                  onChange={(e) => setFilter({ ...filter, text: e.target.value })}
                />
              </div>

              {/* 難易度 */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-300">難易度</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((diff) => (
                    <label
                      key={diff}
                      className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filter.difficultyList.includes(diff)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...filter.difficultyList, diff]
                            : filter.difficultyList.filter((d) => d !== diff);
                          setFilter({ ...filter, difficultyList: next });
                        }}
                        className="rounded border-slate-700 text-[#4fd1d1] focus:ring-0 cursor-pointer"
                      />
                      <span>Lv.{diff}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ダンジョンサイズ（横幅・高さ） */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">横幅サイズ (Width)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="最小"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                      value={filter.mapSizeWidthFrom}
                      onChange={(e) => setFilter({ ...filter, mapSizeWidthFrom: e.target.value })}
                    />
                    <span className="text-slate-500">〜</span>
                    <input
                      type="number"
                      placeholder="最大"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                      value={filter.mapSizeWidthTo}
                      onChange={(e) => setFilter({ ...filter, mapSizeWidthTo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">高さサイズ (Height)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="最小"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                      value={filter.mapSizeHeightFrom}
                      onChange={(e) => setFilter({ ...filter, mapSizeHeightFrom: e.target.value })}
                    />
                    <span className="text-slate-500">〜</span>
                    <input
                      type="number"
                      placeholder="最大"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                      value={filter.mapSizeHeightTo}
                      onChange={(e) => setFilter({ ...filter, mapSizeHeightTo: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* プレイステータス */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-300">プレイ状況</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "クリア済", value: "CLEAR" },
                    { label: "未クリア", value: "NOT_CLEARED" },
                    { label: "失敗", value: "FAILURE" },
                    { label: "中断", value: "INTERRUPT" },
                  ].map((status) => (
                    <label
                      key={status.value}
                      className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filter.playStatusList.includes(status.value)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...filter.playStatusList, status.value]
                            : filter.playStatusList.filter((s) => s !== status.value);
                          setFilter({ ...filter, playStatusList: next });
                        }}
                        className="rounded border-slate-700 text-[#4fd1d1] focus:ring-0 cursor-pointer"
                      />
                      <span>{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* お気に入り */}
              <div className="pt-1">
                <label className="flex items-center gap-2 bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={filter.isFavoritesList.includes("true")}
                    onChange={(e) => {
                      setFilter({
                        ...filter,
                        isFavoritesList: e.target.checked ? ["true"] : [],
                      });
                    }}
                    className="rounded border-slate-700 text-[#4fd1d1] focus:ring-0 cursor-pointer"
                  />
                  <span className="font-bold text-slate-300">お気に入り登録したダンジョンのみ</span>
                </label>
              </div>
            </div>

            {/* フッター */}
            <div className="flex gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-lg cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>リセット</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 bg-[#4fd1d1] hover:bg-[#3dbdbd] text-slate-950 font-black py-2.5 px-4 rounded-lg cursor-pointer shadow-lg shadow-[#4fd1d1]/20"
              >
                検索する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
