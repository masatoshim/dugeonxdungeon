export const metadata = {
  title: "利用規約 | DUNGEONZ×DUNGEONZ",
  description: "DUNGEONZ×DUNGEONZ の利用規約です。",
};

export default function TermsPage() {
  const updatedAt = "2026年10月25日";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <span className="text-xs font-mono text-slate-500">最終改定日: {updatedAt}</span>
        </div>

        {/* ページタイトル */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">利用規約</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            本利用規約（以下「本規約」といいます）は、DUNGEONZ×DUNGEONZ（以下「本サービス」といいます）の提供条件および本サービスの利用に関する、運営者とユーザーの皆様との間の権利義務関係を定めるものです。本サービスをご利用になる前に、必ず全文をお読みください。
          </p>
        </div>

        {/* 規約本文 */}
        <div className="space-y-10 text-sm leading-relaxed text-slate-300 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-10 shadow-xl">
          {/* 第1条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">第1条（適用および同意）</h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
              <li>本規約は、ユーザーと運営者との間の本サービスの利用に関わる一切の関係に適用されます。</li>
              <li>
                ユーザーは、本サービスを利用した時点（ダンジョンの作成、プレイ、アカウント登録等を含みます）で、本規約の全ての記載内容に同意したものとみなされます。
              </li>
            </ol>
          </section>

          {/* 第2条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">第2条（アカウント管理）</h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
              <li>ユーザーは、自己の責任においてアカウント（ログイン情報等）を厳重に管理・保管するものとします。</li>
              <li>
                ユーザーは、理由のいかんを問わず、アカウントを第三者に譲渡、貸与、または売買等をしてはなりません。
              </li>
              <li>
                アカウントの管理不十分、使用上の過誤、第三者の使用等によって生じた損害に関する責任はユーザー自身が負うものとし、運営者は一切の責任を負いません。
              </li>
            </ol>
          </section>

          {/* 第3条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">
              第3条（コンテンツの権利帰属および保証）
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
              <li>
                ユーザーが本サービス上で作成・投稿したダンジョンデータ、マップレイアウト、テキスト等のコンテンツ（以下「ユーザーコンテンツ」といいます）の著作権は、当該ユーザーに帰属します。
              </li>
              <li>
                ユーザーは、運営者に対し、ユーザーコンテンツを本サービスの提供、運営、プロモーション、機能改善に必要な範囲において、無償・非独占的に利用（複製、表示、公衆送信、改変等）する権利を許諾するものとします。
              </li>
              <li>
                <strong>
                  ユーザーは、自らが投稿するユーザーコンテンツについて、第三者の著作権、商標権、プライバシー権その他の権利を侵害していないことを保証するものとします。
                </strong>
              </li>
              <li>
                ユーザーコンテンツに関して第三者から権利侵害等の申し立てや損害賠償請求がなされた場合、当該ユーザーは自己の責任と費用においてこれを解決するものとし、運営者を一切免責させるものとします。
              </li>
            </ol>
          </section>

          {/* 第4条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">第4条（禁止事項）</h2>
            <p className="text-xs text-slate-400">
              ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
              <li>法令または公序良俗に違反する行為、および犯罪行為に関連する行為</li>
              <li>運営者、他のユーザー、または第三者の著作権、商標権等の知的財産権を侵害する行為</li>
              <li>
                過度に暴力的な表現、差別的表現、猥褻な表現、その他他人に不快感を与えるダンジョンやテキストを公開する行為
              </li>
              <li>チートツール、マクロ、不正スクリプトの使用等により、ゲーム結果やランキングを不正に操作する行為</li>
              <li>サーバーやネットワークに過度な負荷をかける行為、または意図的にシステムの不具合を突く攻撃行為</li>
              <li>他のユーザーになりすます行為、または他のユーザーに対する嫌がらせ・迷惑行為</li>
              <li>運営者の事前の許可を得ていない営利目的の宣伝、勧誘行為</li>
            </ol>
          </section>

          {/* 第5条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">
              第5条（コンテンツの削除および利用停止権限）
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
              <li>
                運営者は、ユーザーコンテンツが本規約の禁止事項に違反している、または第三者の権利を侵害していると判断した場合、
                <strong>事前通知を行うことなく、自らの判断で当該コンテンツの削除、非公開化、または変更</strong>
                を行うことができるものとします。
              </li>
              <li>
                運営者は、禁止事項に該当する行為を行ったユーザーに対し、事前通知なく本サービスの利用停止またはアカウント削除等の措置をとることができるものとします。
              </li>
              <li>運営者は、本条に基づく措置によってユーザーに生じた損害について、一切の責任を負いません。</li>
            </ol>
          </section>

          {/* 第6条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">
              第6条（サービスの変更・中断・免責）
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
              <li>
                運営者は、事前の通知なく本サービスの内容を変更し、または提供を一時停止・終了することができるものとします。
              </li>
              <li>
                運営者は、データのバックアップ義務を負いません。理由のいかんを問わず、保存されたデータの消失・破壊・改ざんによって生じた損害について、一切の責任を負いません。
              </li>
              <li>
                運営者は、本サービスに事実上または法律上の欠陥（安全性、信頼性、正確性、バグやエラー、権利侵害等）がないことを保証しておりません。
              </li>
              <li>
                消費者契約法の適用その他の理由により運営者が損害賠償責任を負う場合であっても、運営者の賠償責任はユーザーに直接かつ現実に生じた通常損害に限定されるものとします。
              </li>
            </ol>
          </section>

          {/* 第7条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">第7条（規約の変更）</h2>
            <p>
              運営者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の利用規約は、本サービス上に掲載した時点から効力を生じるものとします。
            </p>
          </section>

          {/* 第8条 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-l-2 border-[#4fd1d1] pl-3">
              第8条（準拠法および管轄裁判所）
            </h2>
            <p>
              本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、運営者の所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
