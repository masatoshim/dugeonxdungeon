import nodemailer from "nodemailer";

// Gmail SMTP トランスポーターの設定
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_SERVER_PORT) || 465,
  secure: true, // 465ポートの場合はtrue
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

// 管理者のメールアドレス
const ADMIN_EMAIL = process.env.EMAIL_SERVER_USER;
const DOMAIN = process.env.NEXTAUTH_URL || "http://localhost:3000";

/**
 * ユーザー向け：新規登録時の確認メール送信
 */
export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${DOMAIN}/api/verify?token=${token}`;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"DUNGEON×DUNGEON" <${process.env.EMAIL_SERVER_USER}>`,
    to: email,
    subject: "【DUNGEON×DUNGEON】メールアドレスを確認してください",
    html: `
      <p>DUNGEON×DUNGEON への登録ありがとうございます！</p>
      <p>以下のリンクをクリックして、登録を完了させてください。</p>
      <p><a href="${confirmLink}">${confirmLink}</a></p>
      <p>※このリンクは24時間有効です。</p>
    `,
  });

  return info;
};

/**
 * 管理者向け：送信制限超過時のアラートメール送信
 */
export const sendAdminAlertEmail = async (failedUserEmail: string) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"DUNGEON×DUNGEON SYSTEM" <${process.env.EMAIL_SERVER_USER}>`,
    to: ADMIN_EMAIL,
    subject: "【緊急】メール送信エラーアラート",
    html: `
      <h2>メール送信エラーアラート</h2>
      <p>メール送信処理でエラーが発生した可能性があります。</p>
      <p><strong>対象ユーザー:</strong> ${failedUserEmail}</p>
      <p><strong>対応策:</strong></p>
      <ul>
        <li>ログやDBのステータスを確認してください。</li>
        <li>Gmailの送信制限等を確認してください。</li>
      </ul>
    `,
  });
};

/**
 * ユーザー向け：パスワード再設定メール送信
 */
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${DOMAIN}/login/reset-password?token=${token}`;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"DUNGEON×DUNGEON" <${process.env.EMAIL_SERVER_USER}>`,
    to: email,
    subject: "【DUNGEON×DUNGEON】パスワード再設定のご案内",
    html: `
      <p>DUNGEON×DUNGEON のパスワード再設定リクエストを受け付けました。</p>
      <p>以下のリンクをクリックして、新しいパスワードを設定してください。</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>※このリンクは1時間有効です。</p>
      <p>身に覚えがない場合は、このメールを無視していただいて問題ありません。</p>
    `,
  });

  return info;
};
