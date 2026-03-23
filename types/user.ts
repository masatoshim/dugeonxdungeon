import { Role } from "@prisma/client";
import { DateTime } from "next-auth/providers/kakao";

/**
 * ユーザー情報の共通プロパティ
 */
export interface UserBase {
  id: string;
  userName: string;
  nickName: string | null;
  iconImageKey: string | null;
  // 管理者のみ、または本人のみ取得可能にする項目
  email?: string | null;
  isActive?: boolean;
  deletedFlg?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  role?: Role;
}

/**
 * APIレスポンス
 */
export interface UserResponse extends UserBase {
  emailVerified?: string | null; // ISO 8601 文字列
  lastLoginAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  // 統計情報
  ranking: number | null;
  totalPlayScore: number;
  totalPlayTime: number;
  totalPlayCount: number;
  playDungeonCount: number;
  clearPlayCount: number;
  failurePlayCount: number;
  interruptPlayCount: number;
  publishedDungeonCount: number;
  dungeonCount?: number;
  dungeons?: { dungeonCode?: string }[] | null;
  playHistories?: { dungeonCode?: string; userId: string; createdAt?: string }[] | null;
  favouriteDungeons?: { dungeonCode?: string }[] | null;
}

/**
 * 更新リクエスト
 */
export interface UpdateUserRequest extends Omit<UserBase, "id"> {}

/**
 * 更新レスポンス
 */
export interface UpdateUserResponse {
  message: string;
  user: UserBase;
}

/**
 * 一覧取得のレスポンス
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
