import useSWRMutation from "swr/mutation";
import { confirmClear } from "@/app/_libs/dungeons-api";
import { PlayHistoryResponse } from "@/types";
import { toast } from "sonner";

export const useConfirmClear = () => {
  const { trigger, isMutating, error } = useSWRMutation<PlayHistoryResponse, Error, string, { pendingId: string }>(
    "/api/clear/confirm",
    (_, { arg }) => confirmClear(arg.pendingId),
    {
      onSuccess: (data) => {
        toast.success("履歴を登録しました");
      },
      onError: (err) => {
        toast.error(`履歴の登録に失敗しました: ${err.message}`);
      },
    },
  );

  return {
    confirm: trigger, // page.tsxからこれを呼んで登録を実行
    isCreating: isMutating,
    createError: error?.message ?? "",
  };
};
