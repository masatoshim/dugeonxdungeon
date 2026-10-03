"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, Loader2, UserCheck } from "lucide-react";
import { useGetUsers } from "@/app/_hooks";

interface UserSearchSelectProps {
  selectedUserId: string;
  onSelect: (userId: string, userName: string) => void;
}

export function UserSearchSelect({ selectedUserId, onSelect }: UserSearchSelectProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(""); // 入力中の一時的な文字列のみ管理
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // URLから直接取得（これが「唯一の真実」になります）
  const urlUserName = searchParams.get("userName") || "";

  const { users, isLoading } = useGetUsers({
    userName: query.length >= 2 ? query : undefined,
    limit: 10,
  });

  // 表示する値の決定ロジック
  // 1. 入力中（queryがある）なら query を表示
  // 2. ドロップダウンが開いているなら query を表示
  // 3. それ以外でURLに名前があれば、その名前を表示
  const displayValue = query !== "" || isOpen ? query : urlUserName;

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery(""); // 閉じるときに入力をリセット（URLの表示に戻すため）
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleClear = () => {
    setQuery("");
    onSelect("", "");
    setIsOpen(false);
  };

  return (
    <div className="relative w-64" ref={containerRef}>
      <div className="relative flex items-center">
        {selectedUserId ? (
          <UserCheck className="absolute left-3 text-cyan-400" size={16} />
        ) : (
          <Search className="absolute left-3 text-gray-500" size={16} />
        )}

        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="ユーザー名で検索..."
          className={`w-full bg-[#1a1d2b] border rounded-lg py-2 pl-10 pr-10 text-sm transition-all ${
            selectedUserId
              ? "border-cyan-500/50 text-cyan-400 font-bold"
              : "border-gray-800 text-white focus:border-cyan-400"
          }`}
        />

        <div className="absolute right-3 flex items-center gap-1">
          {isLoading && <Loader2 className="animate-spin text-gray-500" size={16} />}
          {(query || selectedUserId) && (
            <button type="button" onClick={handleClear} className="text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {isOpen && query.length >= 2 && users && users.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl z-50 py-1 border border-gray-200">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                // 親のメソッドを呼ぶ。ここでURLが更新される。
                onSelect(user.id, user.userName);
                setQuery(""); // 自身の入力はクリア（URL側の表示に切り替わる）
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              {user.userName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
