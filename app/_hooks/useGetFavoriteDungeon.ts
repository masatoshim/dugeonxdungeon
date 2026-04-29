import useSWR from "swr";
import { FavoriteStatusResponse } from "@/types";
import { getFavoriteDungeon } from "@/app/_libs/dungeons-api";
import { useSession } from "next-auth/react";

export const useGetFavoriteDungeon = (id: string, userId?: string) => {
  const { data: _, status } = useSession();
  const { data, error, isLoading, mutate } = useSWR<FavoriteStatusResponse>(
    status === "authenticated" ? [`/api/dungeons/${id}/favorite`, id, userId] : null,
    ([_, id, userId]: [string, string, string]) => getFavoriteDungeon(id, userId),
  );

  return {
    favoritedungeon: data,
    isFavorited: data?.isFavorited ?? false,
    fetched: !isLoading,
    isLoading,
    error: error instanceof Error ? error.message : "",
    mutate,
  };
};
