import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { sendPasswordResetEmail } from "@/app/_libs/mail";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "メールアドレスは必須です。" }, { status: 400 });
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // セキュリティ上の配慮:
    // 登録されていないメールアドレスであってもレスポンスを返す
    if (!user) {
      return NextResponse.json({ message: "パスワード再設定用のメールを送信しました。" }, { status: 200 });
    }

    // 一意のトークンと有効期限を生成
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600 * 1000); // 1時間有効

    // データベースにトークンと有効期限を保存
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // メール送信処理
    await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({ message: "パスワード再設定用のメールを送信しました。" }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}
