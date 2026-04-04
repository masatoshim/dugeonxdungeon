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
        // 管理者用のダンジョン一覧画面へ
        if (session?.user?.role === "ADMIN") {
          // todo: 未実装
          // router.push("/admin/dungeons/admin");
          return;
        } else {
          // 一般ユーザー用のダンジョン一覧画面へ
          // todo: 未実装
          router.push("/dungeons");
        }
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
