import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

type Props = {
  initialData: any;
  isEditMode: boolean;
  isAdmin?: boolean;
  defaultOpen?: boolean;
};

export const DungeonMetadataCard = ({ initialData, isEditMode, isAdmin, defaultOpen = false }: Props) => {
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 transition-all duration-300">
      {/* ヘッダー（クリックで開閉） */}
      <div
        className="flex items-center justify-between cursor-pointer group mb-2 select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors uppercase tracking-wider">
          Dungeon Info
        </h2>
        <button
          type="button"
          className="text-gray-500 group-hover:text-white p-1 hover:bg-gray-800 rounded transition-colors"
          aria-label={isOpen ? "情報を最小化" : "情報を展開"}
        >
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 最小化時のアニメーションラッパー */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="text-[11px] space-y-2.5 text-gray-400 font-mono">
            <div className="flex justify-between items-center border-b border-gray-800/60 pb-1.5">
              <span>ダンジョンコード:</span>
              <span>{initialData.code}</span>
            </div>

            {/* バージョン */}
            <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
              <span>バージョン:</span>
              <span className="text-gray-200 font-bold">v{initialData.version ?? 1}</span>
            </div>

            {isAdmin && (
              <>
                {/* ユーザーID */}
                <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
                  <span>作成者ID:</span>
                  <span className="text-gray-200 truncate max-w-[140px]" title={initialData.userId}>
                    {initialData.userId}
                  </span>
                </div>
                {/* ユーザーネーム */}
                <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
                  <span>ユーザーネーム:</span>
                  <span className="text-gray-200 truncate max-w-[140px]" title={initialData.userId}>
                    {initialData.userName}
                  </span>
                </div>
                {/* ニックネーム */}
                <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
                  <span>ニックネーム:</span>
                  <span className="text-gray-200 truncate max-w-[140px]" title={initialData.userId}>
                    {initialData.nickName}
                  </span>
                </div>
              </>
            )}

            {/* お気に入り登録数 */}
            <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
              <span>お気に入り登録数:</span>
              <span className="text-gray-200 font-bold">{initialData.favoritesCount ?? 0}</span>
            </div>

            {/* 遊ばれた回数 */}
            <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
              <span>遊ばれた回数:</span>
              <span className="text-gray-200 font-bold">{initialData.totalPlayCount ?? 0}</span>
            </div>

            {/* クリア回数 */}
            <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
              <span>クリア回数:</span>
              <span className="text-gray-200 font-bold">{initialData.clearPlayCount ?? 0}</span>
            </div>

            {/* 失敗回数 */}
            <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
              <span>失敗回数:</span>
              <span className="text-gray-200 font-bold">{initialData.failurePlayCount ?? 0}</span>
            </div>

            {/* 中断回数 */}
            <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
              <span>中断回数:</span>
              <span className="text-gray-200 font-bold">{initialData.interruptPlayCount ?? 0}</span>
            </div>

            {/* 作成日時 */}
            <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
              <span>作成日時:</span>
              <span className="text-gray-200">{formatDate(initialData.createdAt)}</span>
            </div>

            {/* 最終更新日時 */}
            <div className="flex justify-between">
              <span>最終更新:</span>
              <span className="text-gray-200">{formatDate(initialData.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
