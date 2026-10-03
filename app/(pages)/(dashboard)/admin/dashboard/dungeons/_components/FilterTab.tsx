"use client";

interface FilterTabProps {
  value: string;
  onChange: (value: "admin" | "user") => void;
}

export function FilterTab({ value, onChange }: FilterTabProps) {
  return (
    <div className="flex bg-[#1a1d2b] p-1 rounded-lg border border-gray-800">
      <button
        onClick={() => onChange("admin")}
        className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
          value === "admin" ? "bg-cyan-400 text-[#0f111a]" : "text-gray-400 hover:text-white"
        }`}
      >
        管理者
      </button>
      <button
        onClick={() => onChange("user")}
        className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
          value === "user" ? "bg-cyan-400 text-[#0f111a]" : "text-gray-400 hover:text-white"
        }`}
      >
        ユーザー
      </button>
    </div>
  );
}
