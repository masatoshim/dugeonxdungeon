"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";

type Props = { isAdmin: boolean };

export const BackButton = ({ isAdmin }: Props) => {
  const router = useRouter();
  const {
    formState: { isDirty },
  } = useFormContext();

  const targetPath = isAdmin ? "/admin/dashboard/dungeons" : "/dashboard/dungeons";

  // タブ閉じやリロード、外部URLへの離脱対策
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      (e as any).returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // ブラウザの「戻る」ボタン対策
  useEffect(() => {
    if (!isDirty) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (window.confirm("変更が保存されていません。終了しますか？")) {
        router.push(targetPath);
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty, router, targetPath]);

  const handleClick = () => {
    if (isDirty) {
      if (!window.confirm("変更が保存されていません。終了しますか？")) {
        return;
      }
    }
    router.push(targetPath);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center w-6 h-6 text-slate-400 hover:text-cyan-400 bg-slate-950/40 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-cyan-500/30 shrink-0"
      title="管理画面に戻る"
    >
      <ArrowLeft size={18} />
    </button>
  );
};
