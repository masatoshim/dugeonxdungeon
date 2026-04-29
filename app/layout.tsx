import "./globals.css";
import { NextAuthProvider } from "@/app/(pages)/_components/NextAuthProvider";
import Header from "@/app/(pages)/_components/Header";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <NextAuthProvider>
          <Header />
          <main>{children}</main>
          <Toaster position="top-center" richColors />
        </NextAuthProvider>
      </body>
    </html>
  );
}
