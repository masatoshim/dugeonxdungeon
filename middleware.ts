import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // ログイン済みユーザーが /login にアクセスした場合
  if (token && pathname === "/login") {
    // role に応じてリダイレクト先を振り分ける
    if (token.role === "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
