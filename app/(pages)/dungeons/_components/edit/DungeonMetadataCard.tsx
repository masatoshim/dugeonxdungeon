import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { DungeonResponse } from "@/app/_types";

type Props = {
  initialData?: DungeonResponse;
  isEditMode: boolean;
  isAdmin?: boolean;
  defaultOpen?: boolean;
  onClose: () => void;
};

export const DungeonMetadataCard = ({ initialData, isEditMode, isAdmin, defaultOpen = false, onClose }: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // 新規作成時はメタデータがないため表示しない
  if (!isEditMode || !initialData) return null;

  // 日時のフォーマット関数
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-xl p-3.5 sm:p-4 w-full shadow-2xl">
      {/* ヘッダー（クリックで開閉） */}
      <div
        className="flex items-center justify-between cursor-pointer group select-none gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors uppercase tracking-wider truncate">
          Dungeon Info
        </h2>

        {/* ボタン群 */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="text-gray-500 group-hover:text-white p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label={isOpen ? "情報を最小化" : "情報を展開"}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
            aria-label="パネルを閉じる"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 最小化時のアニメーションラッパー */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="text-[11px] space-y-2 text-gray-400 font-mono">
            {/* ダンジョンコード */}
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5 gap-2">
              <span className="shrink-0">ダンジョンコード:</span>
              <span className="text-gray-200 font-bold truncate" title={initialData.code}>
                {initialData.code}
              </span>
            </div>

            {/* バージョン */}
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5 gap-2">
              <span className="shrink-0">バージョン:</span>
              <span className="text-gray-200 font-bold shrink-0">
                v{initialData.versionMajor ?? 1}.{initialData.versionMinor ?? 0}
              </span>
            </div>

            {isAdmin && (
              <>
                {/* ユーザーID */}
                <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5 gap-2">
                  <span className="shrink-0">作成者ID:</span>
                  <span className="text-gray-200 truncate max-w-[110px] text-right" title={initialData.userId}>
                    {initialData.userId}
                  </span>
                </div>
                {/* ユーザーネーム */}
                <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5 gap-2">
                  <span className="shrink-0">ユーザーネーム:</span>
                  <span className="text-gray-200 truncate max-w-[110px] text-right" title={initialData.userName ?? ""}>
                    {initialData.userName}
                  </span>
                </div>
                {/* ニックネーム */}
                <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5 gap-2">
                  <span className="shrink-0">ニックネーム:</span>
                  <span className="text-gray-200 truncate max-w-[110px] text-right" title={initialData.nickName ?? ""}>
                    {initialData.nickName}
                  </span>
                </div>
              </>
            )}

            {/* お気に入り登録数 */}
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5 gap-2">
              <span className="shrink-0">お気に入り登録数:</span>
              <span className="text-gray-200 font-bold shrink-0">{initialData.favoritesCount ?? 0}</span>
            </div>

            {/* 遊ばれた回数 */}
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5 gap-2">
              <span className="shrink-0">遊ばれた回数:</span>
              <span className="text-gray-200 font-bold shrink-0">{initialData.totalPlayCount ?? 0}</span>
            </div>

            {/* クリア回数 */}
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5 gap-2">
              <span className="shrink-0">クリア回数:</span>
              <span className="text-gray-200 font-bold shrink-0">{initialData.clearPlayCount ?? 0}</span>
            </div>

            {/* 失敗回数 */}
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5 gap-2">
              <span className="shrink-0">失敗回数:</span>
              <span className="text-gray-200 font-bold shrink-0">{initialData.failurePlayCount ?? 0}</span>
            </div>

            {/* 中断回数 */}
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5 gap-2">
              <span className="shrink-0">中断回数:</span>
              <span className="text-gray-200 font-bold shrink-0">{initialData.interruptPlayCount ?? 0}</span>
            </div>

            {/* 作成日時 */}
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5 gap-2">
              <span className="shrink-0">作成日時:</span>
              <span className="text-gray-200 truncate shrink-0">{formatDate(initialData.createdAt)}</span>
            </div>

            {/* 最終更新日時 */}
            <div className="flex justify-between items-center gap-2">
              <span className="shrink-0">最終更新:</span>
              <span className="text-gray-200 truncate shrink-0">{formatDate(initialData.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
