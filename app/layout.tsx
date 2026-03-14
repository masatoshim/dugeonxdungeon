import "./globals.css";
import { NextAuthProvider } from "@/app/_components/NextAuthProvider";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
