import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 保護対象の判定ロジック
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isAdminPage = pathname.startsWith("/admin");
  const isEditOrTestPage = pathname.includes("/edit") || pathname.includes("/test-play");

  // 未ログインユーザーが「管理・編集・テスト」系にアクセスした場合
  if (!token && (isDashboardPage || isAdminPage || isEditOrTestPage)) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 一般ユーザーが管理者用 /admin にアクセスした場合
  if (isAdminPage && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ログイン済みユーザーが /login にアクセスした場合
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/admin/:path*",
    //  "/dungeons/:path*",
  ],
};
