import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useDungeonAuth(onShowLoginAlert: () => void) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 「創る」をクリックしたときの共通制御
  const handleCreateClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    // 未ログインの場合は遷移をブロックしてポップアップを表示
    if (status === "unauthenticated") {
      onShowLoginAlert();
      return;
    }

    // ログイン済みなら適切なダッシュボードへ遷移
    if (session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard/dungeons");
    } else {
      router.push("/dashboard/dungeons");
    }
  };

  return {
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    handleCreateClick,
  };
}
