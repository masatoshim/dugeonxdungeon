import { DungeonStatus } from "@prisma/client";
import { DateTime } from "next-auth/providers/kakao";

/**
 * ダンジョン情報の共通プロパティ
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
  mapSize: number;
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
 * APIレスポンス
 */
export interface DungeonResponse extends DungeonBase {
  totalPlayCount: number;
  createdAt: string; // ISO 8601 文字列
  updatedAt: string;
}

/**
 * 新規作成リクエスト
 */
export interface CreateDungeonRequest extends Omit<DungeonBase, "id" | "status" | "isTemplate"> {
  tagIds?: number[];
}

/**
 * 更新リクエスト
 */
export interface UpdateDungeonRequest extends Omit<DungeonBase, "id" | "isTemplate"> {
  tagIds?: number[];
}

/**
 * 更新レスポンス
 */
export interface UpdateDungeonResponse {
  message: string;
  dungeon: DungeonBase;
}

/**
 * 一覧取得APIのレスポンス
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
