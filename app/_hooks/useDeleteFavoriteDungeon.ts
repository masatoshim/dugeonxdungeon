import useSWRMutation from "swr/mutation";
import { deleteFavoriteDungeon } from "@/app/_libs/dungeons-api";
import { FavoriteDungeonResponse } from "@/types";
import { toast } from "sonner";

export const useDeleteFavoriteDungeon = (id: string) => {
  const { trigger, isMutating, error } = useSWRMutation<FavoriteDungeonResponse, Error, string[], string>(
    [`/api/dungeons/${id}/favorite/deleteFavorite`, id],
    ([url, dungeonId]) => deleteFavoriteDungeon(dungeonId),
    {
      onSuccess: (data) => {
        toast.success("お気に入りを削除しました");
      },
      onError: (err) => {
        toast.error(`処理に失敗しました: ${err.message}`);
      },
    },
  );

  return {
    remove: trigger,
    isDeleting: isMutating,
    deleteError: error?.message ?? "",
  };
};
