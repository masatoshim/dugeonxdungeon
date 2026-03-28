import { useState, useEffect } from "react";

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

  const handleBlur = () => {
    let val = parseInt(tempValue);

    // 空文字、NaN、1未満は 4 に戻す（ダンジョンサイズの最小値）
    if (isNaN(val) || val < 1) {
      val = 4;
    }

    // ダンジョンサイズの最大値を超えないよう設定
    if (val > 999) {
      val = 999;
    }

    setTempValue(val.toString());
    onConfirm(val); // 確定した数値のみを親に返す
  };

  return (
    <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded border border-gray-700">
      <span className="text-[10px] text-gray-500 font-bold">{label}</span>
      <input
        type="number"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        // フォーカスが外れるか、Enterキー押下で確定
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === "Enter" && handleBlur()}
        className="w-8 bg-transparent text-center text-xs focus:outline-none appearance-none"
        min="1"
      />
    </div>
  );
}
