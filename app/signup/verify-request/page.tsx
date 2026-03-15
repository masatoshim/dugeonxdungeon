import Link from "next/link";

export default function VerifyRequestPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 text-white">
      <div className="w-full max-max-w-md rounded-lg border-2 border-dashed border-slate-700 bg-slate-800 p-8 text-center shadow-xl">
        <div className="mb-6 text-6xl">✉️</div>

        <h1 className="mb-4 text-2xl font-bold tracking-tighter text-yellow-500">冒険の書を準備中...</h1>

        <p className="mb-6 text-slate-300">
          <span className="font-semibold text-white">{email}</span> 宛に 確認メールを送信しました。
        </p>

        <div className="mb-8 space-y-4 text-sm text-slate-400">
          <p>メール内のリンクをクリックして、冒険を開始してください。</p>
          <p className="text-xs italic">※メールが届かない場合は、迷惑メールフォルダをご確認ください。</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/login" className="rounded bg-slate-700 px-4 py-2 transition-colors hover:bg-slate-600">
            ログイン画面へ戻る
          </Link>
          <button className="text-xs text-slate-500 hover:underline">メールを再送する（未実装）</button>
        </div>
      </div>
    </div>
  );
}
