import useSWRMutation from "swr/mutation";
import { createFavoriteDungeon } from "@/app/_libs/dungeons-api";
import { CreateFavoriteDungeonResponse } from "@/types";
import { toast } from "sonner";

export const useCreateFavoriteDungeon = (id: string) => {
  const { trigger, isMutating, error } = useSWRMutation<CreateFavoriteDungeonResponse, Error, string[], string>(
    [`/api/dungeons/${id}/favorite`, id],
    ([url, dungeonId]) => createFavoriteDungeon(dungeonId),
    {
      onSuccess: (data) => {
        toast.success(data.isFavorited ? "お気に入りに追加しました" : "お気に入りから削除しました");
      },
      onError: (err) => {
        toast.error(`処理に失敗しました: ${err.message}`);
      },
    },
  );

  return {
    create: trigger,
    isCreating: isMutating,
    createError: error?.message ?? "",
  };
};
