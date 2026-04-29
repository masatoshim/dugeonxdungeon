import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_libs/auth";
// 動作確認用
export default async function Home() {
  // サーバー側でセッションを取得
  const session = await getServerSession(authOptions);
  console.log("Server Side Session:", session);

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-4">ログインセッション確認</h1>

      <div className="bg-gray-100 p-4 rounded-md">
        <h2 className="text-sm text-gray-500 mb-2">User Session Data:</h2>
        <pre className="bg-white p-4 border rounded">{JSON.stringify(session?.user, null, 2)}</pre>
      </div>

      {!session && <p className="mt-4 text-red-500">ログインしていません。</p>}

      {session?.user?.role === "ADMIN" && (
        <div className="mt-6 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700">
          <strong>管理者として認識されています！</strong>
          <p>これで管理者専用機能の実装を進められます。</p>
        </div>
      )}
    </main>
  );
}
