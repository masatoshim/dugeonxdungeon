export const metadata = {
  title: "プライバシーポリシー | DUNGEONZ×DUNGEONZ",
  description: "DUNGEONZ×DUNGEONZ のプライバシーポリシーです。",
};

export default function PrivacyPolicyPage() {
  const updatedAt = "2026年10月25日";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <span className="text-xs font-mono text-slate-500">最終改定日: {updatedAt}</span>
        </div>

        {/* ページタイトル */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">プライバシーポリシー</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            DUNGEONZ×DUNGEONZ（以下「本サービス」といきます）は、ユーザーの皆様のプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーでは、本サービスにおける情報の収集、利用、および管理方法について説明します。
          </p>
        </div>

        {/* ポリシー本文 */}
        <div className="space-y-10 text-sm leading-relaxed text-slate-300 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-10 shadow-xl">
          {/* 第1条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">第1条（収集する情報）</h2>
            <p className="text-xs text-slate-400">
              本サービスでは、サービスの提供および運営のため、以下の情報を取得・収集する場合があります。
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
              <li>
                <strong>アカウント情報</strong>: 外部認証サービス（Google /
                GitHub等）を利用する際に連携されるメールアドレス、ユーザー名、ニックネーム、プロフィール画像等
              </li>
              <li>
                <strong>プレイ・作成データ</strong>:
                ユーザーが作成したダンジョンデータ、マップ情報、クリア履歴、スコア、ランキング情報、お気に入り登録等のゲーム内データ
              </li>
              <li>
                <strong>アクセスログ・利用環境</strong>:
                利用しているブラウザの種類、IPアドレス、アクセス日時、Cookie等の識別子を用いた利用状況の分析データ
              </li>
            </ol>
          </section>

          {/* 第2条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">第2条（情報の利用目的）</h2>
            <p className="text-xs text-slate-400">収集した情報は、以下の目的のために利用いたします。</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
              <li>本サービスの提供、維持、保護および改善のため（ユーザー認証、セッション管理等）</li>
              <li>ランキングの集計・表示、およびゲーム機能（ダンジョンの保存・公開等）の正常な動作のため</li>
              <li>
                ユーザーからのお問い合わせに対する回答や、重要なお知らせ（メンテナンス情報や規約変更等）の連絡のため
              </li>
              <li>不正利用、チート行為、規約違反行為の検知・防止、およびトラブルシューティングのため</li>
              <li>サービスの利用状況の統計データ作成、および今後の機能開発・マーケティング分析のため</li>
            </ol>
          </section>

          {/* 第3条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">
              第3条（第三者提供の制限）
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
              <li>
                運営者は、個人情報保護法その他の法令により認められる場合を除き、あらかじめユーザーの同意を得ることなく、個人情報を第三者に提供しません。
              </li>
              <li>
                ただし、クラウドインフラストラクチャのホスティングサービス、データベース管理、およびアクセス解析ツール等の業務委託先に対し、サービスの運営に必要な範囲で個人情報の取り扱いを委託する場合があります。
              </li>
            </ol>
          </section>

          {/* 第4条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">
              第4条（Cookieおよびアクセス解析ツール）
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
              <li>
                本サービスでは、セッションの維持や利便性の向上のためにCookieおよびローカルストレージを使用しています。
              </li>
              <li>
                本サービスでは、利用状況を把握するためにGoogle
                Analytics等のアクセス解析ツールを利用する場合があります。これらはトラフィックデータの収集のためにCookieを使用しますが、データは匿名で収集されており、個人を特定するものではありません。
              </li>
            </ol>
          </section>

          {/* 第5条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">第5条（安全管理措置）</h2>
            <p>
              運営者は、収集した情報の漏洩、滅失、き損の防止、その他情報の安全管理のために必要かつ適切なセキュリティ対策を講じます。ただし、インターネット上の通信においてセキュリティを完全に保証することは困難であるため、万一の不正アクセス等に対しては、法令の定めに基づき誠実に対応いたします。
            </p>
          </section>

          {/* 第6条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">
              第6条（プライバシーポリシーの変更）
            </h2>
            <p>
              本ポリシーの内容は、法令の改正やサービスの仕様変更に伴い、予告なく変更されることがあります。変更後のプライバシーポリシーは、本サービス上に掲載した時点から効力を生じるものとします。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
