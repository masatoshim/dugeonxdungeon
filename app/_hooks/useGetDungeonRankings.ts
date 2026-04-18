import useSWR from "swr";
import { DungeonRankingsResponse } from "@/types";
import { getDungeonRankings } from "@/app/_libs/dungeons-api";
import { useSession } from "next-auth/react";

export const useGetDungeonRankings = (id?: string) => {
  const { data: _, status } = useSession();
  const { data, error, isLoading, mutate } = useSWR<DungeonRankingsResponse>(
    status === "authenticated" ? [`/api/dungeons/${id}/rankings`, id] : null,
    ([_, id]: [string, string]) => getDungeonRankings(id),
  );

  return {
    dungeonRankings: data,
    fetched: !isLoading,
    isLoading,
    error: error instanceof Error ? error.message : "",
    mutate,
  };
};
