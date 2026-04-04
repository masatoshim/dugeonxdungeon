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
