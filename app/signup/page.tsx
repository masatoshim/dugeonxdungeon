import { Suspense } from "react";
import SignupForm from "@/app/_components/SignupForm"; // ロジックを切り出したコンポーネント

export default function SignupPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">Loading...</div>}
    >
      <SignupForm />
    </Suspense>
  );
}
