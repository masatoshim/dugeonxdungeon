"use client";

import { DungeonStatus } from "@prisma/client";

interface StatusOption {
  label: string;
  value: DungeonStatus;
}

const STATUS_OPTIONS: StatusOption[] = [
  { label: "構築中", value: "DRAFT" },
  { label: "非公開", value: "PRIVATE" },
  { label: "公開済", value: "PUBLISHED" },
  { label: "削除済", value: "DELETED" },
];

interface FilterStatusProps {
  value: string;
  onChange: (value: string) => void;
}

export function FilterStatus({ value, onChange }: FilterStatusProps) {
  const currentValues = value ? value.split(",") : [];

  const handleToggle = (status: string) => {
    let newValues: string[];
    if (currentValues.includes(status)) {
      newValues = currentValues.filter((v) => v !== status);
    } else {
      newValues = [...currentValues, status];
    }
    onChange(newValues.join(","));
  };

  return (
    <div className="flex bg-[#1a1d2b] rounded-lg border border-gray-800 p-1 gap-1">
      {STATUS_OPTIONS.map((opt) => {
        const isSelected = currentValues.includes(opt.value);

        return (
          <button
            key={opt.value}
            onClick={() => handleToggle(opt.value)}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${
              isSelected
                ? "bg-[#242938] text-white shadow-sm ring-1 ring-gray-700"
                : "text-gray-500 hover:text-gray-300 hover:bg-[#1f2230]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
