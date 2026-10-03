import useSWRMutation from "swr/mutation";
import { createPendingClear } from "@/app/_apis/dungeons-api";
import { PendingClearRequest } from "@/app/_types";
import { toast } from "sonner";

export const useCreatePendingClear = () => {
  const { trigger, isMutating, error } = useSWRMutation<{ pendingId: string }, Error, string, PendingClearRequest>(
    "/api/clear/pending",
    (_, { arg }) => createPendingClear(arg),
    {
      onSuccess: (data) => {
        toast.success("スコアを一時保存しました");
      },
      onError: (err) => {
        toast.error(`一時保存に失敗しました: ${err.message}`);
      },
    },
  );

  return {
    create: trigger, // page.tsxからこれを呼んで登録を実行
    isCreating: isMutating,
    createError: error?.message ?? "",
  };
};
