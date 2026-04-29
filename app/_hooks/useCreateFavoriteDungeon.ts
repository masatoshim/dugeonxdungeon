import useSWRMutation from "swr/mutation";
import { createFavoriteDungeon } from "@/app/_libs/dungeons-api";
import { FavoriteDungeonResponse } from "@/types";
import { toast } from "sonner";

export const useCreateFavoriteDungeon = (id: string) => {
  const { trigger, isMutating, error } = useSWRMutation<FavoriteDungeonResponse, Error, string[], string>(
    [`/api/dungeons/${id}/favorite/favorite`, id],
    ([url, dungeonId]) => createFavoriteDungeon(dungeonId),
    {
      onSuccess: (data) => {
        toast.success("お気に入りに追加しました");
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
