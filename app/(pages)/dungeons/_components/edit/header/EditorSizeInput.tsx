import { useState, useEffect } from "react";

const MAX_SIZE = 999;
const MIN_SIZE = 4;

interface EditorSizeInputProps {
  label: string; // "R" や "C" など識別用
  initialValue: number;
  onConfirm: (newValue: number) => void;
}

export function EditorSizeInput({ label, initialValue, onConfirm }: EditorSizeInputProps) {
  // 表示用
  const [tempValue, setTempValue] = useState(initialValue.toString());

  useEffect(() => {
    setTempValue(initialValue.toString());
  }, [initialValue]);

  // 値を範囲内に収めるユーティリティ
  const clampValue = (val: string | number) => {
    const num = parseInt(val.toString(), 10);
    if (isNaN(num)) return MIN_SIZE;
    return Math.min(Math.max(num, MIN_SIZE), MAX_SIZE);
  };

  // 確定処理
  const commitValue = (val: string) => {
    const finalValue = clampValue(val);
    setTempValue(finalValue.toString());
    onConfirm(finalValue); // 親に即反映
  };

  const handleBlur = () => {
    commitValue(tempValue);
  };

  return (
    <div className="flex items-center gap-1.5 bg-gray-800 px-2 py-0.5 rounded border border-gray-700 h-full">
      <span className="text-[11px] text-gray-400 font-black tracking-wider uppercase select-none">{label}</span>
      <input
        type="number"
        value={tempValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setTempValue(newValue);
          // スピンボタン（矢印ボタン）による操作の場合
          const isSpinButton = (e.nativeEvent as any).inputType === undefined;
          if (isSpinButton) {
            commitValue(newValue);
          }
        }}
        onKeyDown={(e) => {
          // 上下矢印キーが押された場合はその場で確定処理へ
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            setTimeout(() => commitValue((e.target as HTMLInputElement).value), 0);
          } else if (e.key === "Enter") {
            handleBlur();
          }
        }}
        onBlur={handleBlur}
        className="w-11 bg-transparent text-center text-sm font-bold text-slate-100 focus:outline-none appearance-none p-0 border-none focus:ring-0"
        min={MIN_SIZE}
        max={MAX_SIZE}
      />
    </div>
  );
}
