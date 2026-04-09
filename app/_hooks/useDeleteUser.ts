import useSWRMutation from "swr/mutation";
import { deleteUser } from "@/app/_libs/users-api";
import { toast } from "sonner";

export const useDeleteUser = (id: string) => {
  const { trigger, isMutating, error } = useSWRMutation<void, Error, string[], void>(
    ["/api/users", id],
    () => deleteUser(id),
    {
      onSuccess: () => {
        toast.success("ユーザーを削除しました");
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
