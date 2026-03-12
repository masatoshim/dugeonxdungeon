import { Role } from "@prisma/client";
import { DateTime } from "next-auth/providers/kakao";

/**
 * ユーザー情報の基本レスポンス
 */
export interface UserBase {
  id: string;
  userName: string;
  nickName: string | null;
  iconImageKey: string | null;
  role?: Role;
  // 統計情報
  ranking: number | null;
  totalPlayScore: number;
  totalPlayTime: number;
  totalPlayCount: number;
  playDungeonCount: number;
  clearPlayCount: number;
  failurePlayCount: number;
  interruptPlayCount: number;
  dungeonCount: number;
  publishedDungeonCount: number;
  dungeons?: { id?: string; code?: string }[] | null;
  playHistories?: { id?: string; code?: string; createdAt?: string }[] | null;
  favouriteDungeons?: { id: string; code: string }[] | null;
  // 管理者のみ、または本人のみ取得可能にする項目
  email?: string | null;
  isActive?: boolean;
  deletedFlg?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
}

/**
 * APIレスポンス用
 */
export interface UserResponse extends UserBase {
  emailVerified?: string | null; // ISO 8601 文字列
  lastLoginAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
/**
 * ユーザー一覧取得のレスポンス
 */
export interface UsersIndexResponse {
  users: UserResponse[];
  meta: {
    totalCount: number;
    index: number;
    limit: number;
    hasNext: boolean;
  };
}

/**
 * ユーザー更新リクエスト
 * 一般ユーザーが変更できる項目に限定
 */
export interface UpdateUserRequest {
  nickName?: string | null;
  iconImageKey?: string | null;
  // 管理者のみ変更可能な項目（API内部で権限チェックする）
  role?: Role;
  isActive?: boolean;
}
