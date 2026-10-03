import useSWR from "swr";
import { DungeonResponse } from "@/app/_types";
import { getDungeon } from "@/app/_apis/dungeons-api";
import { useSession } from "next-auth/react";

export const useGetDungeon = (id?: string) => {
  const { data: _, status } = useSession();
  const { data, error, isLoading, mutate } = useSWR<DungeonResponse>(
    // 未ログインユーザーでも取得可能
    id ? ["/api/dungeons", id] : null,
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
