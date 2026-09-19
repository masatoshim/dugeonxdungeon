import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { nanoid } from "nanoid";
import { sendVerificationEmail, sendAdminAlertEmail } from "@/app/_libs/mail";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "メールアドレスが指定されていません" }, { status: 400 });
    }

    // ユーザーが存在するか確認
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        deletedFlg: false,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "ユーザーが見つかりませんでした" }, { status: 404 });
    }

    if (user.emailVerified && user.isActive) {
      return NextResponse.json({ message: "このメールアドレスは既に認証されています。" }, { status: 400 });
    }

    // 新しいトークンと有効期限を発行
    const token = nanoid();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 古いトークンの削除と新しいトークンの作成
    await prisma.$transaction(async (tx) => {
      // 既存の同じメールアドレス宛の未使・古いトークンを削除
      await tx.verificationToken.deleteMany({
        where: { identifier: email },
      });

      // 新しいトークンを保存
      await tx.verificationToken.create({
        data: {
          identifier: email,
          token: token,
          expires: expires,
        },
      });
    });

    try {
      // 確認メールを再送信
      await sendVerificationEmail(email, token);

      return NextResponse.json(
        {
          message: "確認メールを再送信しました。24時間以内にリンクをクリックして登録を完了してください。",
        },
        { status: 200 },
      );
    } catch (mailError: any) {
      if (mailError?.status === 429) {
        sendAdminAlertEmail(email).catch(console.error);

        return NextResponse.json(
          {
            message: "現在、確認メールの送信制限に達しています。時間を置いて再度お試しください。",
          },
          { status: 429 },
        );
      }

      throw mailError;
    }
  } catch (error) {
    console.error("Resend Verification Error:", error);
    return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
