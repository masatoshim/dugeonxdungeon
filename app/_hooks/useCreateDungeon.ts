import useSWRMutation from "swr/mutation";
import { createDungeon } from "@/app/_libs/dungeons-api";
import { CreateDungeonRequest, DungeonResponse } from "@/types";
import { toast } from "sonner";

export const useCreateDungeon = () => {
  const { trigger, isMutating, error } = useSWRMutation<DungeonResponse, Error, string, CreateDungeonRequest>(
    "/api/dungeons",
    (_, { arg }) => createDungeon(arg),
    {
      onSuccess: (data) => {
        toast.success("ダンジョンを登録しました");
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
