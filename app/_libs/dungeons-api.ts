import {
  DungeonResponse,
  DungeonFilter,
  DungeonsIndexResponse,
  CreateDungeonRequest,
  UpdateDungeonRequest,
  DungeonRankingsResponse,
  CreatePlayHistoryRequest,
  PlayHistoryResponse,
  CreateFavoriteDungeonResponse,
  FavoriteStatusResponse,
  PendingClearRequest,
} from "@/types";

// ダンジョンを登録する関数
export const createDungeon = async (data: CreateDungeonRequest): Promise<DungeonResponse> => {
  const res = await fetch("/api/dungeons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("登録に失敗しました");
  return await res.json();
};

// ダンジョン一覧を取得する関数
export const fetchDungeons = async (params?: DungeonFilter): Promise<DungeonsIndexResponse> => {
  const query = params ? new URLSearchParams(params as any).toString() : "";

  const res = await fetch(`/api/dungeons${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`取得に失敗しました: ${res.status}`);
  return (await res.json()) as DungeonsIndexResponse;
};

// ダンジョン詳細を取得する関数
export const getDungeon = async (id: string): Promise<DungeonResponse> => {
  const res = await fetch(`/api/dungeons/${id}`);
  if (!res.ok) throw new Error(`取得に失敗しました: ${res.status}`);
  return await res.json();
};

// ダンジョンを更新する関数
export const updateDungeon = async (id: string, data: UpdateDungeonRequest): Promise<DungeonResponse> => {
  const res = await fetch(`/api/dungeons/${id}`, {
    method: "PATCH", // または PUT
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`更新に失敗しました: ${res.status}`);
  return await res.json();
};

// ダンジョンを削除する関数
export const deleteDungeon = async (id: string): Promise<void> => {
  const res = await fetch(`/api/dungeons/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`削除に失敗しました: ${res.status}`);
};

// ダンジョンごとのユーザーランキングを取得する関数
export const getDungeonRankings = async (id: string): Promise<DungeonRankingsResponse> => {
  const res = await fetch(`/api/dungeons/${id}/rankings`);
  if (!res.ok) throw new Error(`取得に失敗しました: ${res.status}`);
  return await res.json();
};

// プレイ履歴を登録する関数
export const createPlayHistory = async (id: string, data: CreatePlayHistoryRequest): Promise<PlayHistoryResponse> => {
  const res = await fetch(`/api/dungeons/${id}/play-history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("登録に失敗しました");
  return await res.json();
};

// お気に入りダンジョンを取得する関数
export const getFavoriteDungeon = async (id: string, userId?: string): Promise<FavoriteStatusResponse> => {
  const url = userId ? `/api/dungeons/${id}/favorite?userId=${userId}` : `/api/dungeons/${id}/favorite`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`取得に失敗しました: ${res.status}`);
  return await res.json();
};

// プレイ履歴を登録する関数
export const createFavoriteDungeon = async (id: string): Promise<CreateFavoriteDungeonResponse> => {
  const res = await fetch(`/api/dungeons/${id}/favorite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("登録に失敗しました");
  return await res.json();
};

// 未ログイン時のクリアデータを一時保存する関数
export const createPendingClear = async (data: PendingClearRequest): Promise<{ pendingId: string }> => {
  const res = await fetch("/api/clear/pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("スコアの一時保存に失敗しました");
  return await res.json();
};

// ログイン後、一時保存されたデータを正式登録する関数
export const confirmClear = async (pendingId: string): Promise<PlayHistoryResponse> => {
  const res = await fetch("/api/clear/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pendingId }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "正式登録に失敗しました");
  }
  return await res.json();
};
