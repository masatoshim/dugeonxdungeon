import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// 管理者のメールアドレス（ご自身のアドレスに書き換えてください）
const ADMIN_EMAIL = "your-email@example.com";
// サイトのURL（開発環境と本番環境で切り替え）
const DOMAIN = process.env.NEXTAUTH_URL || "http://localhost:3000";

/**
 * ユーザー向け：新規登録時の確認メール送信
 */
export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${DOMAIN}/api/verify?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: "DUNGEON×DUNGEON <onboarding@resend.dev>", // Todo: 本番ドメイン取得後は書き換え
    to: email,
    subject: "【DUNGEON×DUNGEON】メールアドレスを確認してください",
    html: `
      <p>DUNGEON×DUNGEON への登録ありがとうございます！</p>
      <p>以下のリンクをクリックして、登録を完了させてください。</p>
      <p><a href="${confirmLink}">${confirmLink}</a></p>
      <p>※このリンクは24時間有効です。</p>
    `,
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * 管理者向け：送信制限超過時のアラートメール送信
 */
export const sendAdminAlertEmail = async (failedUserEmail: string) => {
  await resend.emails.send({
    from: "SYSTEM <onboarding@resend.dev>",
    to: ADMIN_EMAIL,
    subject: "【緊急】メール送信制限に達しました",
    html: `
      <h2>メール送信エラーアラート</h2>
      <p>Resendの無料枠上限（1日100通）に達した可能性があります。</p>
      <p><strong>対象ユーザー:</strong> ${failedUserEmail}</p>
      <p><strong>対応策:</strong></p>
      <ul>
        <li>Resendのダッシュボードを確認してください。</li>
        <li>必要であれば、手動でDBの isActive フラグを更新してください。</li>
        <li>登録者が急増している場合は、プランのアップグレードを検討してください。</li>
      </ul>
    `,
  });
};
