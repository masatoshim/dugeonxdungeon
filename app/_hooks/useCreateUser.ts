import useSWRMutation from "swr/mutation";
import { createUser } from "@/app/_libs/users-api";
import { CreateUserRequest, UserResponse } from "@/types";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// memo: サインアップ時の登録処理は別に実装しているため、本APIは使用しない想定
// memo: サインアップ時のロジック見直しが発生した場合、改めて本APIの使用可否について検討する
export const useCreateUser = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const { trigger, isMutating, error } = useSWRMutation<UserResponse, Error, string, CreateUserRequest>(
    "/api/users",
    (_, { arg }) => createUser(arg),
    {
      onSuccess: (data) => {
        toast.success("ユーザーを登録しました");
      },
      onError: (err) => {
        toast.error(`登録に失敗しました: ${err.message}`);
      },
    },
  );

  return {
    create: trigger,
    isCreating: isMutating,
    createError: error?.message ?? "",
  };
};
