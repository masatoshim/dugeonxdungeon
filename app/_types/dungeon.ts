import { DungeonStatus } from "@prisma/client";

/**
 * ダンジョンデータの共通プロパティ
 */
export interface DungeonBase {
  id: string;
  name: string;
  code: string;
  userId: string;
  description: string | null;
  mapData: any;
  mapSizeHeight: number;
  mapSizeWidth: number;
  timeLimit: number;
  difficulty: number;
  status: DungeonStatus;
  isTemplate: boolean;
  userName?: string;
  nickName?: string | null;
  tags?: string[];
  createdBy: string;
  updatedBy: string;
}

/**
 * DB内部やサーバーサイドでのみ使用する型
 */
export interface DungeonEntity extends DungeonBase {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * APIレスポンス用
 */
export interface DungeonResponse extends DungeonBase {
  totalPlayCount: number;
  createdAt: string; // ISO 8601 文字列
  updatedAt: string;
}

/**
 * 新規作成リクエスト用
 */
export interface CreateDungeonRequest extends Omit<DungeonBase, "id" | "status" | "isTemplate"> {
  tagIds?: number[];
}

/**
 * 一覧取得APIのレスポンス全体
 */
export interface DungeonsIndexResponse {
  dungeons: DungeonResponse[];
  meta: {
    totalCount: number;
    index: number;
    limit: number;
    hasNext: boolean;
  };
}
