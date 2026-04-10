import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 未ログインユーザーの制限
  const isAuthPage = pathname === "/login";
  const isProtectedPage =
    pathname.startsWith("/admin") || pathname.includes("/edit") || pathname.includes("/test-play");

  if (!token && isProtectedPage) {
    // 未ログインで保護ページへアクセスした場合はログインへ
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname); // ログイン後に戻れるように
    return NextResponse.redirect(url);
  }

  // 【管理者制限】
  if (pathname.startsWith("/admin")) {
    if (token?.role !== "ADMIN") {
      // 管理者以外はトップへ強制送還
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ログイン済みユーザーが /login にアクセスした場合
  if (token && isAuthPage) {
    // ロールに関わらず、ログイン済みならトップへ（将来的に /admin/home 等へ変更可）
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/dungeons/:id/edit", "/dungeons/:id/test-play"],
};
