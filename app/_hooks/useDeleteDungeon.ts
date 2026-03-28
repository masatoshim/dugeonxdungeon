import useSWRMutation from "swr/mutation";
import { deleteDungeon } from "@/app/_libs/dungeons-api";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export const useDeleteDungeon = (id: string) => {
  const router = useRouter();
  const { data: session } = useSession();

  const { trigger, isMutating, error } = useSWRMutation<void, Error, string[], void>(
    ["/api/dungeons", id],
    () => deleteDungeon(id),
    {
      onSuccess: () => {
        toast.success("ダンジョンを削除しました");
        // 管理者の場合は管理一覧へ、ユーザーの場合はマイページへ
        if (session?.user?.role === "ADMIN") {
          // todo: 未実装
          router.push("/admin/dungeons");
        } else {
          // 一般ユーザー用のダンジョン一覧画面へ
          // todo: 未実装
          router.push("/dungeons");
        }
      },
      onError: (err) => {
        toast.error(`削除に失敗しました: ${err.message}`);
      },
    },
  );

  return {
    remove: trigger, // page.tsxからこれを呼んで削除を実行
    isDeleting: isMutating,
    deleteError: error?.message ?? "",
  };
};
