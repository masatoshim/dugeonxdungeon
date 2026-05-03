import useSWR from "swr";
import { DungeonsIndexResponse, PaginationFilter } from "@/types";
import { getPlayHistory } from "@/app/_libs/dungeons-api";
import { useSession } from "next-auth/react";

export const useGetPlayHistory = (filter?: PaginationFilter) => {
  const { data: _, status } = useSession();
  const { data, error, isLoading, mutate } = useSWR<DungeonsIndexResponse>(
    status === "authenticated" ? ["/api/dungeons/history", filter] : null,
    ([_, f]: [string, PaginationFilter]) => getPlayHistory(f),
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
