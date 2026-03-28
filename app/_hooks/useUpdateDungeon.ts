import useSWRMutation from "swr/mutation";
import { updateDungeon } from "@/app/_libs/dungeons-api";
import { UpdateDungeonRequest, DungeonResponse } from "@/types";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export const useUpdateDungeon = (id: string) => {
  const router = useRouter();
  const { data: session } = useSession();

  const { trigger, isMutating, error } = useSWRMutation<DungeonResponse, Error, string[], UpdateDungeonRequest>(
    ["/api/dungeons", id],
    (key, { arg }) => updateDungeon(id, arg),
    {
      onSuccess: (data) => {
        // 管理者用のダンジョン一覧画面へ
        if (session?.user?.role === "ADMIN") {
          // todo: 未実装
          // router.push("/admin/dungeons");
          return;
        }
        // 一般ユーザー用のダンジョン一覧画面へ
        // todo: 未実装
        // router.push("/dungeons");
      },
    },
  );

  return {
    update: trigger, // page.tsxからこれを呼んで更新を実行
    isUpdating: isMutating,
    updateError: error?.message ?? "",
  };
};
