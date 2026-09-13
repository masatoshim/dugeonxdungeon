import { NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "トークンとパスワードは必須です。" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "パスワードは8文字以上で入力してください。" }, { status: 400 });
    }

    // トークンに一致し、かつ有効期限内のユーザーを検索
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(), // 現在時刻より後（期限内）
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "パスワード再設定トークンが無効であるか、有効期限が切れています。" },
        { status: 400 },
      );
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // パスワードを更新し、使用済みトークンと有効期限をクリア
    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return NextResponse.json({ message: "パスワードを正常に再設定しました。" }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}
