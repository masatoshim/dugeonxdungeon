"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Search, X, RotateCcw } from "lucide-react";
import Link from "next/link";
import { DUNGEON_DEFAULT } from "@/game-core/types";

export interface DungeonFilterValues {
  text: string;
  difficultyList: number[];
  mapSizeWidthFrom: string;
  mapSizeWidthTo: string;
  mapSizeHeightFrom: string;
  mapSizeHeightTo: string;
  timeLimitFrom: string;
  timeLimitTo: string;
  playStatusList: string[];
  isFavoritesList: string[];
}

interface DungeonSearchFilterModalProps {
  initialValues: DungeonFilterValues;
  onSearch: (queryString: string) => void;
}

function FilterNumberInput({
  placeholder,
  value,
  onChange,
  min = DUNGEON_DEFAULT.MIN_SIZE,
  max = DUNGEON_DEFAULT.MAX_SIZE,
  otherValue,
  isMaxSide = false,
}: {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  min?: number;
  max?: number;
  otherValue?: string;
  isMaxSide?: boolean;
}) {
  const [tempValue, setTempValue] = useState(value);

  const handleBlur = () => {
    if (tempValue === "") {
      onChange("");
      return;
    }

    const num = parseInt(tempValue, 10);
    if (isNaN(num)) {
      setTempValue("");
      onChange("");
      return;
    }

    // 動的な上限・下限の決定
    let effectiveMin = min;
    let effectiveMax = max;

    if (otherValue !== "" && otherValue !== undefined) {
      const otherNum = parseInt(otherValue, 10);
      if (!isNaN(otherNum)) {
        if (isMaxSide) {
          // 最大側なら、最小値はFromを下回ってはいけない
          effectiveMin = Math.max(min, otherNum);
        } else {
          // 最小側なら、最大値はToを上回ってはいけない
          effectiveMax = Math.min(max, otherNum);
        }
      }
    }

    const clamped = Math.min(Math.max(num, effectiveMin), effectiveMax);
    const clampedStr = clamped.toString();

    setTempValue(clampedStr);
    onChange(clampedStr);
  };

  return (
    <input
      type="number"
      placeholder={placeholder}
      min={min}
      max={max}
      value={tempValue}
      onChange={(e) => {
        // タイピング中はそのまま自由に入力を受け付ける
        setTempValue(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleBlur();
        }
      }}
      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-2.5 pr-3 py-1.5 text-slate-100 text-right focus:outline-none focus:border-[#4fd1d1]"
    />
  );
}

export function DungeonSearchFilterModal({ initialValues, onSearch }: DungeonSearchFilterModalProps) {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<DungeonFilterValues>(initialValues);

  const isFiltered =
    Boolean(filter.text && filter.text !== "undefined") ||
    filter.difficultyList.length > 0 ||
    Boolean(filter.mapSizeWidthFrom) ||
    Boolean(filter.mapSizeWidthTo) ||
    Boolean(filter.mapSizeHeightFrom) ||
    Boolean(filter.mapSizeHeightTo) ||
    Boolean(filter.timeLimitFrom) ||
    Boolean(filter.timeLimitTo) ||
    filter.playStatusList.length > 0 ||
    filter.isFavoritesList.length > 0;

  const handleReset = () => {
    setFilter({
      text: "",
      difficultyList: [],
      mapSizeWidthFrom: "",
      mapSizeWidthTo: "",
      mapSizeHeightFrom: "",
      mapSizeHeightTo: "",
      timeLimitFrom: "",
      timeLimitTo: "",
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
    if (filter.timeLimitFrom) {
      params.set("timeLimitFrom", filter.timeLimitFrom);
    }
    if (filter.timeLimitTo) {
      params.set("timeLimitTo", filter.timeLimitTo);
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
        className="relative flex items-center justify-center bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 p-2.5 rounded-lg transition-colors cursor-pointer shadow-sm"
        title="絞り込み検索"
        aria-label="絞り込み検索"
      >
        <Search size={18} />
        {isFiltered && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#4fd1d1] rounded-full ring-2 ring-slate-900" />
        )}
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
              {/* キーワード */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-300">キーワード</label>
                <input
                  type="text"
                  placeholder="ダンジョン名 / コード / 説明 / 作成者"
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
                      <span className="text-amber-400 tracking-tighter" aria-label={`難易度 ${diff}`}>
                        {"★".repeat(diff)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ダンジョンサイズ（横幅・高さ） */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 横幅サイズ */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">
                    横幅サイズ（{DUNGEON_DEFAULT.MIN_SIZE}～{DUNGEON_DEFAULT.MAX_SIZE}）
                  </label>
                  <div className="flex items-center gap-2">
                    <FilterNumberInput
                      placeholder="最小"
                      value={filter.mapSizeWidthFrom}
                      onChange={(val) => setFilter({ ...filter, mapSizeWidthFrom: val })}
                      min={DUNGEON_DEFAULT.MIN_SIZE}
                      max={DUNGEON_DEFAULT.MAX_SIZE}
                      otherValue={filter.mapSizeWidthTo}
                      isMaxSide={false}
                    />
                    <span className="text-slate-500">〜</span>
                    <FilterNumberInput
                      placeholder="最大"
                      value={filter.mapSizeWidthTo}
                      onChange={(val) => setFilter({ ...filter, mapSizeWidthTo: val })}
                      min={DUNGEON_DEFAULT.MIN_SIZE}
                      max={DUNGEON_DEFAULT.MAX_SIZE}
                      otherValue={filter.mapSizeWidthFrom}
                      isMaxSide={true}
                    />
                  </div>
                </div>

                {/* 高さサイズ */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-300">
                    高さサイズ（{DUNGEON_DEFAULT.MIN_SIZE}～{DUNGEON_DEFAULT.MAX_SIZE}）
                  </label>
                  <div className="flex items-center gap-2">
                    <FilterNumberInput
                      placeholder="最小"
                      value={filter.mapSizeHeightFrom}
                      onChange={(val) => setFilter({ ...filter, mapSizeHeightFrom: val })}
                      min={DUNGEON_DEFAULT.MIN_SIZE}
                      max={DUNGEON_DEFAULT.MAX_SIZE}
                      otherValue={filter.mapSizeHeightTo}
                      isMaxSide={false}
                    />
                    <span className="text-slate-500">〜</span>
                    <FilterNumberInput
                      placeholder="最大"
                      value={filter.mapSizeHeightTo}
                      onChange={(val) => setFilter({ ...filter, mapSizeHeightTo: val })}
                      min={DUNGEON_DEFAULT.MIN_SIZE}
                      max={DUNGEON_DEFAULT.MAX_SIZE}
                      otherValue={filter.mapSizeHeightFrom}
                      isMaxSide={true}
                    />
                  </div>
                </div>
              </div>

              {/* 制限時間 */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-300">
                  制限時間（{DUNGEON_DEFAULT.MIN_TIME_LIMIT}～{DUNGEON_DEFAULT.MAX_TIME_LIMIT} 秒）
                </label>
                <div className="flex items-center gap-2">
                  <FilterNumberInput
                    placeholder="最小"
                    value={filter.timeLimitFrom}
                    onChange={(val) => setFilter({ ...filter, timeLimitFrom: val })}
                    min={DUNGEON_DEFAULT.MIN_TIME_LIMIT}
                    max={DUNGEON_DEFAULT.MAX_TIME_LIMIT}
                    otherValue={filter.timeLimitTo}
                    isMaxSide={false}
                  />
                  <span className="text-slate-500">〜</span>
                  <FilterNumberInput
                    placeholder="最大"
                    value={filter.timeLimitTo}
                    onChange={(val) => filter.timeLimitTo !== val && setFilter({ ...filter, timeLimitTo: val })}
                    min={DUNGEON_DEFAULT.MIN_TIME_LIMIT}
                    max={DUNGEON_DEFAULT.MAX_TIME_LIMIT}
                    otherValue={filter.timeLimitFrom}
                    isMaxSide={true}
                  />
                </div>
              </div>

              {/* プレイステータス */}
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                  <label className="font-bold text-slate-300">プレイ状況</label>
                  {!isLoggedIn && (
                    <span className="text-[10px] text-slate-400">
                      ※こちらで検索をする場合は
                      <Link href="/login" className="text-[#4fd1d1] underline hover:text-[#3dbdbd]">
                        ログイン
                      </Link>
                      をしてください
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "クリア済", value: "CLEAR" },
                    { label: "未クリア", value: "NOT_CLEARED" },
                    { label: "失敗", value: "FAILURE" },
                    { label: "中断", value: "INTERRUPT" },
                  ].map((statusItem) => (
                    <label
                      key={statusItem.value}
                      className={`flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 transition-colors ${
                        !isLoggedIn ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!isLoggedIn}
                        checked={filter.playStatusList.includes(statusItem.value)}
                        onChange={(e) => {
                          if (!isLoggedIn) return;
                          const next = e.target.checked
                            ? [...filter.playStatusList, statusItem.value]
                            : filter.playStatusList.filter((s) => s !== statusItem.value);
                          setFilter({ ...filter, playStatusList: next });
                        }}
                        className="rounded border-slate-700 text-[#4fd1d1] focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className={!isLoggedIn ? "text-slate-500" : ""}>{statusItem.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* お気に入り */}
              <div className="pt-1 flex flex-col gap-1.5">
                <label
                  className={`flex items-center gap-2 bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-800 transition-colors ${
                    !isLoggedIn ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={!isLoggedIn}
                    checked={filter.isFavoritesList.includes("true")}
                    onChange={(e) => {
                      if (!isLoggedIn) return;
                      setFilter({
                        ...filter,
                        isFavoritesList: e.target.checked ? ["true"] : [],
                      });
                    }}
                    className="rounded border-slate-700 text-[#4fd1d1] focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className={`font-bold ${!isLoggedIn ? "text-slate-500" : "text-slate-300"}`}>
                    お気に入り登録したダンジョンのみ
                  </span>
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
