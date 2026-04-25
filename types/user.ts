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
 * 検索項目
 */
export interface UserFilter {
  // 共通（ページネーション）
  limit?: number;
  index?: number;
  sort?: string;
  order?: "asc" | "desc";
  // ユーザー基本情報
  role?: Role;
  Id?: string;
  createdBy?: string;
  updatedBy?: string;
  // 文字列曖昧検索
  userName?: string;
  nickName?: string;
  email?: string;
  text?: string;
  // 数値・数値範囲
  ranking?: number;
  rankingFrom?: number;
  rankingTo?: number;
  clearPlayCount?: number;
  clearPlayCountFrom?: number;
  clearPlayCountTo?: number;
  failurePlayCount?: number;
  failurePlayCountFrom?: number;
  failurePlayCountTo?: number;
  interruptPlayCount?: number;
  interruptPlayCountFrom?: number;
  interruptPlayCountTo?: number;
  playDungeonCount?: number;
  playDungeonCountFrom?: number;
  playDungeonCountTo?: number;
  totalPlayTime?: number;
  totalPlayTimeFrom?: number;
  totalPlayTimeTo?: number;
  // 日付・日付範囲
  createdAt?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAt?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  lastLoginAt?: string;
  lastLoginAtFrom?: string;
  lastLoginAtTo?: string;
  emailVerified?: string;
  emailVerifiedFrom?: string;
  emailVerifiedTo?: string;
  // 単一 or リスト
  isActive?: "true" | "false";
  isActiveList?: string;
  deletedFlg?: "true" | "false";
  deletedFlgList?: string;
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
  favoriteDungeons?: { dungeonCode?: string }[] | null;
}

/**
 * 新規作成リクエスト
 */
export interface CreateUserRequest {
  id: string;
  userName: string;
  nickName: string | null;
  iconImageKey: string | null;
  email: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  role: Role;
  hashedPassword: string; // todo: 必要か？
}

/**
 * 更新リクエスト
 */
// todo: passwordを更新する場合にどうするか要検討
export interface UpdateUserRequest {
  nickName?: string | null;
  iconImageKey?: string | null;
  // 管理者のみ、または本人のみ取得可能にする項目
  email?: string | null;
  isActive?: boolean;
  deletedFlg?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
}

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
