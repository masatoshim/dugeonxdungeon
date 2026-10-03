import useSWR from "swr";
import { UsersIndexResponse, UserFilter } from "@/app/_types";
import { fetchUsers } from "@/app/_apis/users-api";
import { useSession } from "next-auth/react";

export const useGetUsers = (filter?: UserFilter) => {
  const { data: _, status } = useSession();
  const { data, error, isLoading, mutate } = useSWR<UsersIndexResponse>(
    // 未ログインユーザーでも取得可能
    status !== "loading" ? ["/api/users", filter] : null,
    ([_, f]: [string, UserFilter]) => fetchUsers(f),
  );

  return {
    users: data?.users ?? [],
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
