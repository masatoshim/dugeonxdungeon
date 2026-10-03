import useSWRMutation from "swr/mutation";
import { confirmClear } from "@/app/_apis/dungeons-api";
import { PlayHistoryResponse } from "@/app/_types";
import { toast } from "sonner";

export const useConfirmClear = () => {
  const { trigger, isMutating, error } = useSWRMutation<PlayHistoryResponse, Error, string, { pendingId: string }>(
    "/api/clear/confirm",
    (_, { arg }) => confirmClear(arg.pendingId),
    {
      onSuccess: (data) => {
        if (data?.isMyDungeon) {
          return;
        }
        toast.success("履歴を登録しました");
      },
      onError: (err) => {
        toast.error(`履歴の登録に失敗しました: ${err.message}`);
      },
    },
  );

  return {
    confirm: trigger,
    isCreating: isMutating,
    createError: error?.message ?? "",
  };
};
