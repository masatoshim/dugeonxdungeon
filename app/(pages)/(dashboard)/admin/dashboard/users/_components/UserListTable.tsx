"use client";

import React from "react";
import { UserResponse } from "@/types";

interface UserListTableProps {
  users: UserResponse[];
  currentPage: number;
  itemsPerPage: number;
}

export function UserListTable({ users, currentPage, itemsPerPage }: UserListTableProps) {
  // スコアのカンマ区切り＋pt整形
  const formatScore = (score: number) => {
    return `${score.toLocaleString()} pt`;
  };

  // プレイ時間の整形
  const formatPlayTime = (seconds: number) => {
    return `${seconds.toLocaleString()} sec`;
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-800/80 shadow-xl bg-[#0f1626]">
      <table className="w-full text-left border-collapse">
        {/* ヘッダー部分 */}
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-sm font-semibold tracking-wider bg-[#131b2e]/50">
            <th className="py-4 px-6 text-center w-20">順位</th>
            <th className="py-4 px-6">ユーザー</th>
            <th className="py-4 px-6 text-right">トータルスコア</th>
            <th className="py-4 px-6 text-right">トータルプレイ時間</th>
            <th className="py-4 px-6 text-center w-40">構築ダンジョン数</th>
            <th className="py-4 px-6 text-center w-24"></th>
          </tr>
        </thead>

        {/* ボディ部分 */}
        <tbody className="divide-y divide-slate-800/40 text-sm font-medium">
          {users.map((user, index) => {
            // ページ番号を考慮した絶対順位の計算
            const displayRank = (currentPage - 1) * itemsPerPage + index + 1;
            const rowBg = index % 2 === 0 ? "bg-[#121425]/70" : "bg-[#181c33]/70";

            return (
              <tr key={user.id} className={`${rowBg} hover:bg-slate-800/40 transition-colors group`}>
                <td className="py-4 px-6 text-center font-mono text-base font-black text-indigo-400">{displayRank}</td>
                <td className="py-4 px-6 text-[#e2d4be] font-sans tracking-wide">{user.userName}</td>
                <td className="py-4 px-6 text-right text-[#e2d4be] font-mono">{formatScore(user.totalPlayScore)}</td>
                <td className="py-4 px-6 text-right text-[#e2d4be] font-mono">{formatPlayTime(user.totalPlayTime)}</td>
                <td className="py-4 px-6 text-center text-[#e2d4be] font-mono text-base">{user.dungeonCount}</td>
                {/* 詳細ボタン */}
                <td className="py-4 px-6 text-center">
                  <button
                    onClick={() => console.log(`User ${user.id} clicked`)}
                    className="bg-[#00d2ff] hover:bg-[#00b5dc] text-slate-950 text-[11px] font-extrabold px-2.5 py-1 rounded shadow-[0_0_10px_rgba(0,210,255,0.3)] hover:shadow-[0_0_15px_rgba(0,210,255,0.5)] transition-all uppercase tracking-tighter"
                  >
                    詳細
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
