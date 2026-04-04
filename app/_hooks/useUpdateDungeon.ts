import useSWRMutation from "swr/mutation";
import { updateDungeon } from "@/app/_libs/dungeons-api";
import { UpdateDungeonRequest, DungeonResponse } from "@/types";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

export const useUpdateDungeon = (id: string) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();

  const { trigger, isMutating, error } = useSWRMutation<DungeonResponse, Error, string[], UpdateDungeonRequest>(
    ["/api/dungeons", id],
    (key, { arg }) => updateDungeon(id, arg),
    {
      onSuccess: (data) => {
        toast.success("ダンジョンを更新しました");
        mutate("/api/dungeons");
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
