import useSWR from "swr";
import { DungeonResponse } from "@/types";
import { getDungeon } from "@/app/_libs/dungeons-api";
import { useSession } from "next-auth/react";

export const useGetDungeon = (id?: string) => {
  const { data: _, status } = useSession();
  const { data, error, isLoading, mutate } = useSWR<DungeonResponse>(
    status === "authenticated" ? ["/api/dungeons", id] : null,
    ([_, id]: [string, string]) => getDungeon(id),
  );

  return {
    dungeon: data,
    fetched: !isLoading,
    isLoading,
    error: error instanceof Error ? error.message : "",
    mutate,
  };
};
