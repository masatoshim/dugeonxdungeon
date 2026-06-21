import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

type Props = { isAdmin: boolean };

export const BackButton = ({ isAdmin }: Props) => {
  const router = useRouter();
  const {
    formState: { isDirty },
  } = useFormContext();

  return (
    <button
      type="button"
      onClick={() => {
        if (isDirty && !window.confirm("変更が保存されていません。終了しますか？")) return;
        router.push(isAdmin ? "/admin/dashboard/dungeons" : "/dashboard/dungeons");
      }}
      className="flex items-center justify-center w-6 h-6 text-slate-400 hover:text-cyan-400 bg-slate-950/40 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-cyan-500/30 shrink-0"
      title="管理画面に戻る"
    >
      <ArrowLeft size={18} />
    </button>
  );
};
