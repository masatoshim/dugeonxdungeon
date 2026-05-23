import { Home, UserCircle, LayoutGrid, Heart, History, Settings, ShieldCheck } from "lucide-react";

export const getNavItems = (role: string | undefined) => {
  const navItems = [
    { label: "プロフィール", href: "/dashboard/profile", icon: UserCircle },
    { label: "マイダンジョン一覧", href: "/dashboard/dungeons", icon: LayoutGrid },
    { label: "お気に入り", href: "/dashboard/favorites", icon: Heart },
    { label: "履歴", href: "/dashboard/history", icon: History },
  ];

  const adminItems = [
    { label: "ホーム", href: "/admin/dashboard/home", icon: Home },
    { label: "ユーザー一覧", href: "/admin/dashboard/users", icon: UserCircle },
    { label: "ダンジョン一覧", href: "/admin/dashboard/dungeons", icon: LayoutGrid },
  ];
  return role === "ADMIN" ? adminItems : navItems;
};
