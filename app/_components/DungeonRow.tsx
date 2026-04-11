"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Maximize, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateDungeon, useDeleteDungeon } from "@/app/_hooks";
import { DungeonResponse, DungeonsIndexResponse } from "@/types";
import { DungeonStatus } from "@prisma/client";
import { KeyedMutator } from "swr";

const STATUS_CONFIG: Record<DungeonStatus, { label: string; className: string }> = {
  DRAFT: { label: "構築中", className: "bg-indigo-900/50 text-indigo-300" },
  PRIVATE: { label: "非公開", className: "bg-red-900/50 text-red-300" },
  DELETED: { label: "削除済", className: "bg-gray-800 text-gray-400" },
  PUBLISHED: { label: "公開中", className: "bg-[#2ab3a3]/20 text-[#2ab3a3]" },
};

interface DungeonRowProps {
  dungeon: DungeonResponse;
  mutate: KeyedMutator<DungeonsIndexResponse>;
  showUserInfo?: boolean;
  isAdminMode?: boolean;
  isHighlighted?: boolean;
}

export function DungeonRow({ dungeon, mutate, showUserInfo, isAdminMode, isHighlighted }: DungeonRowProps) {
  const config = STATUS_CONFIG[dungeon.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PUBLISHED;
  const router = useRouter();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null); // スクロール用の参照

  // ハイライト時に画面内へスクロールさせる処理
  useEffect(() => {
    if (isHighlighted) {
      setShouldAnimate(true);
      // スクロール処理
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      // 4秒後（点滅3回分 + 余韻）にアニメーション用フラグをオフにする
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  const { update, isUpdating } = useUpdateDungeon(dungeon.id);
  const { remove, isDeleting } = useDeleteDungeon(dungeon.id);
  const isLoading = isUpdating || isDeleting;

  const toggleStatus = async () => {
    const nextStatus = dungeon.status === "PUBLISHED" ? "PRIVATE" : "PUBLISHED";
    await update({ status: nextStatus, publishedAt: nextStatus === "PUBLISHED" ? new Date().toISOString() : null });
    toast.success(`ステータスをに変更しました`);

    cleanPath();
    mutate();
  };

  const handleDelete = async () => {
    if (!confirm("このダンジョンを削除してもよろしいですか？")) return;
    try {
      if (isAdminMode) {
        remove();
      } else {
        await update({
          status: "DELETED",
          code: `DEL-${dungeon.code}`,
          deletedFlg: true,
        });
      }
      toast.success("ダンジョンを削除しました");
      mutate();
    } catch (e) {
      toast.error("削除に失敗しました");
    }
  };

  const cleanPath = () => {
    // URLに highlight が含まれている場合のみ、URLを現在のパスに置き換える（パラメータ除去）
    const params = new URLSearchParams(window.location.search);
    if (params.has("highlight")) {
      router.replace(window.location.pathname, { scroll: false });
    }
  };

  return (
    <div
      ref={rowRef}
      className={`relative flex items-center gap-6 p-4 rounded-xl border transition-all duration-1000 ${
        shouldAnimate
          ? "animate-highlight border-[#4fd1d1] z-10 shadow-[0_0_15px_rgba(79,209,209,0.2)]"
          : "border-gray-800 bg-[#0f111a]"
      } ${isLoading ? "opacity-50 pointer-events-none bg-gray-900" : "hover:bg-[#161b2e]"}`}
    >
      {/* ハイライト時のラベル（オプション） */}
      {shouldAnimate && (
        <div className="absolute -top-2 -left-2 bg-[#4fd1d1] text-black text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg">
          UPDATED
        </div>
      )}

      {/* 更新中のインジケーター */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 rounded-xl">
          <Loader2 className="animate-spin text-[#4fd1d1]" size={24} />
        </div>
      )}

      {/* ステータスバッジ */}
      <span className={`w-24 text-center py-1 rounded-md text-xs font-bold shrink-0 ${config.className}`}>
        {config.label}
      </span>

      {/* ユーザー情報 */}
      {showUserInfo && (
        <div className="flex items-center gap-3 w-48 shrink-0 border-l border-gray-700 pl-4">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {dungeon.nickName?.[0] || "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-gray-500 truncate">{dungeon.userName}</span>
            <span className="text-sm text-gray-300 truncate font-medium">{dungeon.nickName}</span>
          </div>
        </div>
      )}

      <span className="text-gray-400 font-mono text-xs w-24 shrink-0">{dungeon.code}</span>
      <span className="flex-1 font-bold text-white truncate">{dungeon.name}</span>

      {/* サイズ & 時間 */}
      <div className="flex items-center gap-4 text-gray-400 text-sm w-44 shrink-0">
        <span className="flex items-center gap-1.5">
          <Maximize size={14} className="text-gray-500" /> {dungeon.mapSizeHeight}x{dungeon.mapSizeWidth}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-gray-500" /> {dungeon.timeLimit}s
        </span>
      </div>

      {/* 操作ボタン群 */}
      <div className="flex items-center gap-2 shrink-0">
        {showUserInfo ? (
          <button
            onClick={() => router.push(`/admin/dashboard/dungeons/user/${dungeon.id}`)}
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-1.5 rounded text-xs font-bold transition-all shadow-sm"
          >
            詳細
          </button>
        ) : (
          <>
            <button
              disabled={isLoading || dungeon.status === "DRAFT"}
              onClick={() => toggleStatus()}
              className={`w-28 py-1.5 rounded text-sm font-bold transition-colors ${
                dungeon.status === "DRAFT"
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-[#4a6cf7] hover:bg-[#3b5bdb] text-white"
              }`}
            >
              {dungeon.status === "DRAFT" ? "公開不可" : dungeon.status === "PRIVATE" ? "公開する" : "非公開にする"}
            </button>
            <button
              onClick={() => router.push(`/dungeons/${dungeon.id}/edit`)}
              disabled={isLoading}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded text-sm font-bold transition-colors"
            >
              編集
            </button>
            <button
              onClick={() => handleDelete()}
              disabled={isLoading}
              className="bg-red-900/40 hover:bg-red-800/60 text-red-300 px-4 py-1.5 rounded text-sm font-bold transition-colors border border-red-800/50"
            >
              削除
            </button>
          </>
        )}
      </div>
    </div>
  );
}
