import { DungeonStatus } from "@prisma/client";

/**
 * ダンジョンデータの基本形
 */
export interface DungeonBase {
  name: string;
  code: string;
  userId: string;
  mapData: any;
  mapSizeHeight: number;
  mapSizeWidth: number;
  description?: string;
  timeLimit?: number;
  difficulty?: number;
  status?: DungeonStatus;
  isTemplate?: boolean;
}

/**
 * DBから取得したときの型（IDや日付、作成者情報を含む）
 */
export interface Dungeon extends DungeonBase {
  id: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
  tags?: { id: number; name: string }[];
}

/**
 * 新規作成リクエスト用（IDなどは不要）
 */
export interface CreateDungeonRequest extends DungeonBase {
  createdBy: string;
  updatedBy: string;
  tagIds?: number[];
}

/**
 * APIレスポンス用
 */
export interface DungeonsIndexResponse {
  dungeons: Dungeon[];
  meta: {
    totalCount: number;
    index: number;
    limit: number;
    hasNext: boolean;
  };
}
