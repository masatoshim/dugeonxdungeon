export function RankingSkeleton() {
  return (
    <div className="space-y-8">
      {/* 上部：Top 3 (Card Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-slate-800/50 rounded-2xl border border-slate-700/50 animate-pulse flex flex-col justify-center px-6 gap-3"
          >
            <div className="flex items-center gap-4">
              {/* アイコン（円形） */}
              <div className="w-12 h-12 bg-slate-700 rounded-full" />
              <div className="space-y-2 flex-1">
                {/* ユーザー名（線） */}
                <div className="h-4 bg-slate-700 rounded w-2/3" />
                {/* スコア（線） */}
                <div className="h-3 bg-slate-700/60 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 下部：4-10位 (List Style) */}
      <div className="bg-slate-800/30 rounded-2xl border border-slate-800 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 border-b border-slate-800/50 last:border-0 animate-pulse"
          >
            <div className="flex items-center gap-6 flex-1">
              {/* 順位番号用 */}
              <div className="w-4 h-4 bg-slate-700 rounded" />
              {/* アイコン */}
              <div className="w-8 h-8 bg-slate-700 rounded-full" />
              {/* ユーザー名 */}
              <div className="h-4 bg-slate-700 rounded w-1/4" />
            </div>
            {/* スコアとタイム */}
            <div className="flex gap-4">
              <div className="h-4 bg-slate-700 rounded w-16" />
              <div className="h-4 bg-slate-700/50 rounded w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
