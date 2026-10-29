import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Gmail SMTP トランスポーターの設定
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_SERVER_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, name, email, targetUrl, message } = body;

    if (!category || !name || !email || !message) {
      return NextResponse.json({ error: "必須項目が不足しています。" }, { status: 400 });
    }

    const categoryLabels: Record<string, string> = {
      bug: "不具合・バグの報告",
      account: "アカウント・ログインに関する問題",
      violation: "不適切なコンテンツの通報",
      feedback: "ご意見・機能追加のご要望",
      other: "その他のお問い合わせ",
    };

    const categoryText = categoryLabels[category] || category;

    // 運営者宛ての通知メール本文
    const adminMailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      replyTo: email, // 返信先をユーザーのメールアドレスに設定
      subject: `【DUNGEONZ】お問い合わせ: ${categoryText}（${name}様）`,
      text: `
DUNGEONZ×DUNGEONZ お問い合わせフォームからメッセージが送信されました。

■ お問い合わせ種別: ${categoryText}
■ お名前 / ニックネーム: ${name}
■ メールアドレス: ${email}
■ 対象URL / ID: ${targetUrl || "なし"}

■ お問い合わせ内容:
${message}
      `,
    };

    // ユーザー宛ての自動返信メール本文
    const userMailOptions = {
      from: process.env.EMAIL_FROM,
      to: email, // 宛先：お問い合わせしたユーザー
      subject: "【DUNGEONZ×DUNGEONZ】お問い合わせを受け付けました",
      text: `
${name} 様

DUNGEONZ×DUNGEONZ 運営チームです。
お問い合わせいただき、誠にありがとうございます。
以下の内容で受け付けいたしました。内容を確認次第、順次対応させていただきます。

---
■ お問い合わせ種別: ${categoryText}
■ 対象URL / ID: ${targetUrl || "なし"}
■ お問い合わせ内容:
${message}
---

※本メールは自動送信です。ご返信いただきましても対応いたしかねますのでご了承ください。

DUNGEONZ×DUNGEONZ 運営
      `,
    };

    // メールを並行して送信
    await Promise.all([transporter.sendMail(adminMailOptions), transporter.sendMail(userMailOptions)]);

    return NextResponse.json({ success: true, message: "送信が完了しました。" });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "メールの送信に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 },
    );
  }
}
