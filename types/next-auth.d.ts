import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * session.user に返されるオブジェクトの型を拡張
   */
  interface Session {
    user: {
      id: string;
      role?: string; // 管理者機能
      name: string;
      nickName: string;
    } & DefaultSession["user"];
  }

  /**
   * Userモデルの型を拡張（adapter経由で取得する場合など）
   */
  interface User {
    id: string;
    role: string;
    deletedFlg?: boolean;
    isActive?: boolean;
    userName?: string;
    nickName?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * callbacks.jwt で扱われるトークンの型を拡張
   */
  interface JWT {
    id: string;
    role: string;
    userName: string;
    nickName?: string;
  }
}
