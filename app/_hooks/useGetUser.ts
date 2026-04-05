import useSWR from "swr";
import { UserResponse } from "@/types";
import { getUser } from "@/app/_libs/users-api";
import { useSession } from "next-auth/react";

export const useGetUser = (id?: string) => {
  const { data: _, status } = useSession();
  const { data, error, isLoading, mutate } = useSWR<UserResponse>(
    status === "authenticated" ? ["/api/users", id] : null,
    ([_, id]: [string, string]) => getUser(id),
  );

  return {
    user: data,
    fetched: !isLoading,
    isLoading,
    error: error instanceof Error ? error.message : "",
    mutate,
  };
};
