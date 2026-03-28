import { DungeonStatus, PlayStatus } from "@prisma/client";

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
  createdBy?: string;
  updatedBy?: string;
}

/**
 * 検索項目
 */
export interface DungeonFilter {
  // 共通（ページネーション）
  limit?: number;
  index?: number;
  sort?: string;
  order?: string;

  // 検索・フィルター
  userId?: string;
  createdBy?: string;
  updatedBy?: string;
  // 文字列曖昧検索
  code?: string;
  name?: string;
  userName?: string;
  nickName?: string;
  text?: string;
  // 数値・数値範囲
  mapSizeHeight?: number;
  mapSizeHeightFrom?: number;
  mapSizeHeightTo?: number;
  mapSizeWidth?: number;
  mapSizeWidthFrom?: number;
  mapSizeWidthTo?: number;
  mapSize?: number;
  mapSizeFrom?: number;
  mapSizeTo?: number;
  timeLimit?: number;
  timeLimitFrom?: number;
  timeLimitTo?: number;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  difficultyFrom?: 1 | 2 | 3 | 4 | 5;
  difficultyTo?: 1 | 2 | 3 | 4 | 5;
  clearPlayCount?: number;
  clearPlayCountFrom?: number;
  clearPlayCountTo?: number;
  failurePlayCount?: number;
  failurePlayCountFrom?: number;
  failurePlayCountTo?: number;
  interruptPlayCount?: number;
  interruptPlayCountFrom?: number;
  interruptPlayCountTo?: number;
  totalPlayTime?: number;
  totalPlayTimeFrom?: number;
  totalPlayTimeTo?: number;
  totalPlayScore?: number;
  totalPlayScoreFrom?: number;
  totalPlayScoreTo?: number;
  favouritesCount?: number;
  favouritesCountFrom?: number;
  favouritesCountTo?: number;
  totalPlayCount?: number;
  totalPlayCountFrom?: number;
  totalPlayCountTo?: number;
  // 日付・日付範囲
  publishedAt?: string;
  publishedAtFrom?: string;
  publishedAtTo?: string;
  createdAt?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAt?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  // 単一 or リスト
  statusList?: string;
  status?: DungeonStatus;
  isTemplateList?: string;
  isTemplate?: "true" | "false";
  deletedFlgList?: string;
  deletedFlg?: "true" | "false";
  isFavouritesList?: string;
  isFavourites?: "true" | "false";
  difficultyList?: string;
  playStatusList?: string;
  playStatus?: PlayStatus;
}

/**
 * APIレスポンス
 */
export interface DungeonResponse extends DungeonBase {
  totalPlayCount: number;
  createdAt?: string; // ISO 8601 文字列
  updatedAt?: string;
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
