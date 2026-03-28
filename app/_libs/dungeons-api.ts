import {
  DungeonResponse,
  DungeonFilter,
  DungeonsIndexResponse,
  CreateDungeonRequest,
  UpdateDungeonRequest,
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
