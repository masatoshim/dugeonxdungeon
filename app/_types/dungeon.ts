import { DungeonStatus, PlayStatus, FavoritesDungeon } from "@prisma/client";
import { MapData } from "@/game-core/types";

/**
 * 検索項目
 */
export interface PaginationFilter {
  userId?: string;
  // 共通（ページネーション）
  limit?: number;
  index?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface DungeonByUserFilter extends PaginationFilter {
  userId?: string;
}

export interface DungeonFilter extends PaginationFilter {
  // ユーザーID
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
  favoritesCount?: number;
  favoritesCountFrom?: number;
  favoritesCountTo?: number;
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
  status?: DungeonStatus;
  statusList?: string;
  isTemplate?: "true" | "false";
  isTemplateList?: string; // "true" | "false"のいずれか、または両方を指定可能
  deletedFlg?: "true" | "false";
  deletedFlgList?: string; // "true" | "false"のいずれか、または両方を指定可能
  isFavorites?: "true" | "false";
  isFavoritesList?: string; // "true" | "false"のいずれか、または両方を指定可能
  difficultyList?: string;
  playStatus?: PlayStatus;
  playStatusList?: PlayStatus[];
  // ユーザーのお気に入り・クリア済み
  checkUserId?: string; // 指定されたユーザーのレスポンスにisCleared,isFavoritedを追加
  clearedByUserId?: string; // 指定されたユーザーがクリアしたダンジョンのみを抽出
  favoritedByUserId?: string; // 指定されたユーザーがお気に入りにしたダンジョンのみを抽出
}

/**
 * ダンジョン共通プロパティ
 */
export interface DungeonBase {
  id: string;
  name: string;
  code: string;
  versionMajor: number;
  versionMinor: number;
  userId?: string;
  description: string | null;
  mapData: MapData;
  mapSizeHeight: number;
  mapSizeWidth: number;
  mapSize: number;
  timeLimit: number;
  difficulty: number;
  status: DungeonStatus;
  isTemplate: boolean;
  userName?: string;
  nickName: string | null;
  userIconImageKey: string | null;
  tags: string[];
  createdBy?: string;
  updatedBy?: string;
}

/**
 * APIレスポンス
 */
// 詳細用レスポンス
export interface DungeonDetailResponse extends DungeonBase {
  isCleared?: boolean;
  isFavorited?: boolean;
  favoritesCount: number;
  clearPlayCount: number;
  failurePlayCount: number;
  interruptPlayCount: number;
  totalPlayCount: number;
  averageClearTime?: number;
  createdAt?: string; // ISO 8601 文字列
  updatedAt?: string;
}

// 一覧用レスポンス
export interface DungeonResponse {
  id: string;
  code: string;
  name: string;
  userId?: string;
  description: string | null;
  mapSizeHeight: number;
  mapSizeWidth: number;
  mapSize: number;
  timeLimit: number;
  difficulty: number;
  status: DungeonStatus;
  isTemplate: boolean;
  favoritesCount: number;
  isCleared?: boolean;
  isFavorited?: boolean;
  nickName: string | null;
  userIconImageKey: string | null;
  userName?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 一覧取得APIのレスポンス
export interface DungeonsIndexResponse {
  dungeons: DungeonResponse[];
  meta: {
    totalCount: number;
    index: number;
    limit: number;
    hasNext: boolean;
  };
}

// 更新レスポンス
export interface UpdateDungeonResponse {
  message: string;
  dungeon: DungeonBase;
}

// お気に入りダンジョン取得のレスポンス
export interface FavoriteStatusResponse {
  isFavorited: boolean;
  favoriteData: FavoritesDungeon | null;
}

// お気に入りダンジョンのレスポンス
export interface FavoriteDungeonResponse {
  isFavorited: boolean;
  count: number;
}

// ダンジョン履歴のレスポンス
export interface PlayHistoryResponse {
  id: string;
  userId: string;
  dungeonId: string;
  playTime: number;
  playScore: number;
  playStatus: PlayStatus;
  createdAt: string; // ISOString
  isMyDungeon: boolean;
}

/**
 * ダンジョンランキングのレスポンス
 */
// ユーザーの最小限の情報
export interface RankingUser {
  nickName: string;
  iconImageKey: string | null;
}

export interface DungeonRankingEntry {
  rank: number;
  user: RankingUser;
  playScore: number;
  clearTime: number;
}

// 自分の記録
export interface MyDungeonRecord {
  rank: number;
  playScore: number;
  clearTime: number | null;
}

// API全体のレスポンス型
export interface DungeonRankingsResponse {
  rankings: DungeonRankingEntry[];
  myRecord: MyDungeonRecord | null;
}

/**
 * リクエスト
 */
// 新規作成リクエスト
export interface CreateDungeonRequest {
  name: string;
  userId: string;
  mapData: MapData;
  mapSizeHeight: number;
  mapSizeWidth: number;
  mapSize: number;
  createdBy: string;
  updatedBy: string;
  code: string;
  description?: string | null;
  timeLimit?: number;
  difficulty?: number;
  status?: DungeonStatus;
  tagIds?: number[];
  isTemplate: boolean;
  versionMajor: number;
  versionMinor: number;
}

// 更新リクエスト
export interface UpdateDungeonRequest {
  code?: string;
  name?: string;
  description?: string | null;
  mapData?: any;
  mapSizeHeight?: number;
  mapSizeWidth?: number;
  mapSize?: number;
  timeLimit?: number;
  difficulty?: number;
  averageClearTime?: number;
  status?: DungeonStatus;
  deletedFlg?: boolean;
  tagIds?: number[];
  versionMajor?: number;
  versionMinor?: number;
  publishedAt?: string | null;
}

// ダンジョン履歴のリクエスト
export interface CreatePlayHistoryRequest {
  playTime: number; // 実際のプレイ時間(sec)
  playScore: number; // 獲得スコア
  playStatus: PlayStatus;
  versionMajor?: number; // ゲームのバージョン管理用（任意）
  versionMinor?: number; // ゲームのバージョン管理用（任意）
}

// クリアデータ一時保存のリクエスト
export interface PendingClearRequest {
  dungeonId: string;
  versionMajor: number;
  versionMinor: number;
  playTime: number;
  playScore: number;
}
