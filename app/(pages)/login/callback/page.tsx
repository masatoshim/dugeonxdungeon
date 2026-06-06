"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import { Suspense } from "react";

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
      <LoginCallbackPageContent />
    </Suspense>
  );
}
function LoginCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    const handleRedirect = async () => {
      const session = await getSession();

      if (!session) {
        // セッションが取れない場合はログインへ戻す
        router.push("/login");
        return;
      }

      // ロール判定ロジック
      if (callbackUrl === "/" || callbackUrl === "" || callbackUrl.includes("/login/callback")) {
        if (session.user.role === "ADMIN") {
          router.push("/admin/dashboard/home");
        } else {
          router.push("/dashboard/profile");
        }
      } else {
        router.push(callbackUrl);
      }
    };

    handleRedirect();
  }, [router, callbackUrl]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-[#4fd1d1] font-mono animate-pulse">認証中...</div>
    </div>
  );
}
