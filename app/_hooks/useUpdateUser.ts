import useSWRMutation from "swr/mutation";
import { updateUser } from "@/app/_libs/users-api";
import { UpdateUserRequest, UserResponse } from "@/types";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

export const useUpdateUser = (id: string) => {
  const { mutate } = useSWRConfig();

  const { trigger, isMutating, error } = useSWRMutation<UserResponse, Error, string[], UpdateUserRequest>(
    ["/api/users", id],
    (key, { arg }) => updateUser(id, arg),
    {
      onSuccess: (data) => {
        toast.success("プロフィールを更新しました");
        mutate("/api/users");
      },
      onError: (err) => {
        toast.error(`更新に失敗しました: ${err.message}`);
      },
    },
  );

  return {
    update: trigger, // page.tsxからこれを呼んで更新を実行
    isUpdating: isMutating,
    updateError: error?.message ?? "",
  };
};
