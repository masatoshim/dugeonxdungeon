import { UserResponse, UserFilter, UsersIndexResponse, CreateUserRequest, UpdateUserRequest } from "@/types";

// ユーザーを登録する関数
export const createUser = async (data: CreateUserRequest): Promise<UserResponse> => {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("登録に失敗しました");
  return await res.json();
};

// ユーザー一覧を取得する関数
export const fetchUsers = async (params?: UserFilter): Promise<UsersIndexResponse> => {
  const query = params ? new URLSearchParams(params as any).toString() : "";

  const res = await fetch(`/api/users${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`取得に失敗しました: ${res.status}`);
  return (await res.json()) as UsersIndexResponse;
};

// ユーザー詳細を取得する関数
export const getUser = async (id: string): Promise<UserResponse> => {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`取得に失敗しました: ${res.status}`);
  return await res.json();
};

// ユーザーを更新する関数
export const updateUser = async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH", // または PUT
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`更新に失敗しました: ${res.status}`);
  return await res.json();
};

// ユーザーを削除する関数
export const deleteUser = async (id: string): Promise<void> => {
  const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`削除に失敗しました: ${res.status}`);
};
