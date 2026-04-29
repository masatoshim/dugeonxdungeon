import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "トークンが見つかりません" }, { status: 400 });
  }

  try {
    // トークンをDBから検索
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    // トークンの存在と有効期限のチェック
    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json({ error: "トークンが無効か、期限が切れています" }, { status: 400 });
    }

    // ユーザーを有効化（isActive を true に）
    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.identifier },
        data: {
          isActive: true,
          emailVerified: new Date(), // メール確認日時を記録
        },
      }),
      // 使い終わったトークンを削除
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    // ログイン画面へリダイレクト。emailを渡して、入力の手間を省く
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("verified", "true");
    loginUrl.searchParams.set("email", verificationToken.identifier);

    // Todo: ユーザーのダッシュボードホームに遷移するよう修正する
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: "認証処理中にエラーが発生しました" }, { status: 500 });
  }
}
