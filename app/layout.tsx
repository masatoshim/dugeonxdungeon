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
          <Toaster
            closeButton
            position="top-center"
            richColors
            duration={2000}
            toastOptions={{
              classNames: {
                closeButton:
                  "!left-auto !right-3 !top-1/2 !-translate-y-1/2 !translate-x-0 !w-8 !h-8 text-base bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white rounded-full flex items-center justify-center shadow-md",
              },
            }}
          />
        </NextAuthProvider>
      </body>
    </html>
  );
}
