import useSWRMutation from "swr/mutation";
import { createDungeon } from "@/app/_libs/dungeons-api";
import { CreateDungeonRequest, DungeonResponse } from "@/types";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export const useCreateDungeon = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const { trigger, isMutating, error } = useSWRMutation<DungeonResponse, Error, string, CreateDungeonRequest>(
    "/api/dungeons",
    (_, { arg }) => createDungeon(arg),
    {
      onSuccess: (data) => {
        toast.success("ダンジョンを登録しました");
      },
      onError: (err) => {
        toast.error(`登録に失敗しました: ${err.message}`);
      },
    },
  );

  return {
    create: trigger, // page.tsxからこれを呼んで登録を実行
    isCreating: isMutating,
    createError: error?.message ?? "",
  };
};
