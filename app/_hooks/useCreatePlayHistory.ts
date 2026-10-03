import useSWRMutation from "swr/mutation";
import { createPlayHistory } from "@/app/_apis/dungeons-api";
import { CreatePlayHistoryRequest, PlayHistoryResponse } from "@/app/_types";
import { toast } from "sonner";

export const useCreatePlayHistory = (id: string) => {
  const { trigger, isMutating, error } = useSWRMutation<PlayHistoryResponse, Error, string[], CreatePlayHistoryRequest>(
    [`/api/dungeons/${id}/play-history`, id],
    (key, { arg }) => createPlayHistory(id, arg),
    {
      onSuccess: (data) => {
        toast.success("履歴を登録しました");
      },
      onError: (err) => {
        toast.error(`登録に失敗しました: ${err.message}`);
      },
    },
  );

  return {
    create: trigger, // page.tsxからこれを呼んで登録を実行
    isCreating: isMutating,
    createError: error?.message ?? "",
  };
};
