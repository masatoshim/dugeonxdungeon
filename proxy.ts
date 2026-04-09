import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 【管理者制限】一般ユーザーが /admin 配下にアクセスした場合
  if (pathname.startsWith("/admin")) {
    // ログインしていない、またはロールが ADMIN 以外の場合
    if (!token || token.role !== "ADMIN") {
      // ログイン画面へ飛ばすか、一般ホームへ飛ばす（ここではログイン画面へ）
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ログイン済みユーザーが /login にアクセスした場合
  if (token && pathname === "/login") {
    // role に応じてリダイレクト先を振り分ける
    if (token.role === "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));

    // todo: 未実装のため、保留。実装次第↑の実装を削除して入れ替え
    // 管理者なら管理者ホームへ、一般なら一般ユーザープロフィールへ
    // const redirectUrl = token.role === "ADMIN" ? "/admin/home" : "/profile";
    // return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
