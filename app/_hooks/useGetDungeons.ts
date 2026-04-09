import useSWR from "swr";
import { DungeonsIndexResponse, DungeonFilter } from "@/types";
import { fetchDungeons } from "@/app/_libs/dungeons-api";
import { useSession } from "next-auth/react";

export const useGetDungeons = (filter?: DungeonFilter) => {
  const { data: _, status } = useSession();
  const { data, error, isLoading, mutate } = useSWR<DungeonsIndexResponse>(
    status === "authenticated" ? ["/api/dungeons", filter] : null,
    ([_, f]: [string, DungeonFilter]) => fetchDungeons(f),
  );

  return {
    dungeons: data?.dungeons ?? [],
    totalCount: data?.meta?.totalCount ?? 0,
    index: data?.meta?.index ?? 0,
    limit: data?.meta?.limit ?? 0,
    hasNext: data?.meta?.hasNext ?? 0,
    fetched: !isLoading,
    isLoading,
    error: error instanceof Error ? error.message : "",
    mutate,
  };
};
