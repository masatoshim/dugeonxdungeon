import { Role } from "@prisma/client";

/**
 * ユーザー情報の基本レスポンス
 */
export interface UserResponse {
  id: string;
  userName: string;
  nickName: string | null;
  iconImageKey: string | null;
  role: Role;
  // 統計情報
  ranking: number | null;
  clearPlayCount: number;
  playDungeonCount: number;
  totalPlayScore: number;
  // 日付（ISO文字列）
  createdAt: string;
  updatedAt: string;
  // 管理者のみ、または本人のみ取得可能にする項目
  email?: string | null;
  isActive?: boolean;
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
