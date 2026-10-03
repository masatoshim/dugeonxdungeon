import Link from "next/link";

interface VerifyErrorPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function VerifyErrorPage({ searchParams }: VerifyErrorPageProps) {
  const { reason } = await searchParams;

  const getErrorMessage = (reason?: string) => {
    switch (reason) {
      case "expired":
        return {
          title: "冒険の書の有効期限が切れています",
          description:
            "認証トークンの有効期限（24時間）が切れてしまったようです。お手数ですが、もう一度アカウント登録またはメールの再送信を行ってください。",
        };
      case "server_error":
        return {
          title: "システムエラーが発生しました",
          description: "認証処理中にサーバー側で問題が発生しました。時間をおいて再度お試しください。",
        };
      default:
        return {
          title: "無効なトークンです",
          description: "認証リンクが正しくないか、すでに使用されています。",
        };
    }
  };

  const errorInfo = getErrorMessage(reason);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 text-white">
      <div className="w-full max-w-md rounded-lg border-2 border-dashed border-red-500/40 bg-slate-800 p-8 text-center shadow-xl">
        <div className="mb-6 text-6xl">⚠️</div>

        <h1 className="mb-4 text-2xl font-bold tracking-tighter text-red-400">{errorInfo.title}</h1>

        <p className="mb-8 text-sm leading-relaxed text-slate-300">{errorInfo.description}</p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded bg-slate-700 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-600"
          >
            ログイン画面へ戻る
          </Link>
          <Link href="/signup" className="text-xs text-slate-400 hover:text-white hover:underline">
            アカウントをもう一度登録する
          </Link>
        </div>
      </div>
    </div>
  );
}
