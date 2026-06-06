"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/_libs/supabase";
import { Camera, Pencil, Link as LinkIcon, Loader2, Trash2, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useProfileIcon } from "@/app/_hooks";
import { deleteOldImage } from "@/app/_libs/storage";
import { PasswordChangeModal } from "./PasswordChangeModal";
import { UserResponse } from "@/types";

interface ProfileCardProps {
  user: UserResponse;
  mutate: () => void;
  update: (data: Partial<UserResponse>) => Promise<UserResponse>;
  remove?: (data: Partial<void>) => Promise<void>;
  isAdminMode?: boolean;
}

export function ProfileCard({ user, mutate, update, remove, isAdminMode }: ProfileCardProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isEditingNickName, setIsEditingNickName] = useState(false);
  const [nickName, setNickName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // 処理用のローディング状態
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isNickNameChanged = user && nickName !== (user.nickName || user.userName);
  const { iconUrl } = useProfileIcon(user?.iconImageKey);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // 初期値の同期
  useEffect(() => {
    if (user) {
      setNickName(user.nickName || user.userName);
    }
  }, [user]);

  const isGoogleUser = user.isGoogleUser;

  // 画像アップロード処理
  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    setIsUploading(true);
    const file = event.target.files[0];
    const oldKey = user.iconImageKey; // 現在のキーを保持
    const filePath = `private/${user.id}/${uuidv4()}`;

    try {
      // 新しい画像をアップロード
      const { data, error: uploadError } = await supabase.storage
        .from("profile_thumbnail")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      await update({ iconImageKey: data.path });

      // 古い画像がある場合、ストレージから削除
      if (oldKey) {
        await deleteOldImage(oldKey).catch((err) => console.error("削除失敗:", err));
      }

      mutate();
    } catch (error: any) {
      alert("エラーが発生しました: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ニックネーム更新処理
  const handleUpdateNickName = async () => {
    try {
      await update({ nickName });
      await updateSession({ nickName });
      setIsEditingNickName(false);
      mutate();
    } catch (error) {
      alert("更新に失敗しました");
    }
  };

  // アクティブ / 非アクティブ（トグル切り替え）処理
  const handleDeactivate = async () => {
    const nextActiveState = !user.isActive;
    const actionText = nextActiveState ? "アクティブ化" : "非アクティブ化";

    if (!window.confirm(`ユーザー「${user.nickName || user.userName}」を${actionText}にしますか？`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      await update({
        isActive: nextActiveState,
      });
      mutate();
      alert(`ユーザーを${actionText}にしました。`);
    } catch (error) {
      console.error(error);
      alert("処理に失敗しました。");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 削除（論理削除・取り消し不可）処理
  const handleLogicalDelete = async () => {
    if (
      !window.confirm(
        `⚠️【警告】ユーザー「${user.nickName || user.userName}」を削除しますか？\nこの操作は画面上から取り消すことができません。`,
      )
    ) {
      return;
    }

    setIsActionLoading(true);
    try {
      if (remove) {
        await remove();
      }
      mutate();
      alert("ユーザーを削除しました。");
    } catch (error) {
      console.error(error);
      alert("削除処理に失敗しました。");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <>
      <div className="bg-[#1a1d2b] border border-slate-700 rounded-2xl p-8 shadow-xl min-h-[580px] flex flex-col relative">
        {/* ユーザーステータス */}
        {isAdminMode && (
          <div className="absolute top-4 left-4 z-10">
            {user.deletedFlg ? (
              /* 1. 削除済みの場合 */
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-red-500/10 text-red-400 border-red-500/20">
                <AlertTriangle size={10} />
                <span>削除済み</span>
              </span>
            ) : user.isActive ? (
              /* 2. アクティブの場合 */
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>アクティブ</span>
              </span>
            ) : (
              /* 3. 非アクティブの場合 */
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                <span>非アクティブ</span>
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div
              className={`w-32 h-32 rounded-full overflow-hidden border-4 bg-slate-800 flex items-center justify-center relative ${
                user.deletedFlg ? "border-red-500/50" : "border-[#4fd1d1]/20"
              }`}
            >
              {isUploading ? (
                <Loader2 className="animate-spin text-[#4fd1d1]" />
              ) : iconUrl ? (
                <Image
                  src={iconUrl}
                  alt="avatar"
                  width={128}
                  height={128}
                  className={`object-cover w-full h-full ${user.deletedFlg ? "grayscale opacity-40" : ""}`}
                  unoptimized
                />
              ) : (
                <div className="text-slate-500 text-xs text-center p-2">No Image</div>
              )}
            </div>

            {!user.deletedFlg && (
              <label className="absolute bottom-0 right-0 p-2 bg-[#4fd1d1] hover:bg-[#3db8b8] rounded-full cursor-pointer transition-colors shadow-lg">
                <Camera size={18} className="text-[#0f111a]" />
                <input
                  type="file"
                  className="hidden"
                  onChange={handleImageChange}
                  accept="image/*"
                  disabled={isUploading || isActionLoading || !user.isActive}
                />
              </label>
            )}
          </div>
        </div>

        <div className="space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            {/* ニックネーム */}
            <div>
              <label className="flex items-center gap-2 text-xs font-mono text-[#4fd1d1] uppercase tracking-widest mb-1">
                ニックネーム
                <button
                  onClick={() => setIsEditingNickName(!isEditingNickName)}
                  className="hover:text-white transition-colors"
                  disabled={isActionLoading || !user.isActive || user.deletedFlg}
                >
                  <Pencil size={14} />
                </button>
              </label>
              {isEditingNickName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nickName}
                    onChange={(e) => setNickName(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-[#4fd1d1]"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateNickName}
                    disabled={!isNickNameChanged || isActionLoading || !user.isActive || user.deletedFlg}
                    className={`text-xs px-2 py-1 rounded font-bold transition-colors ${
                      isNickNameChanged
                        ? "bg-[#4fd1d1] text-[#0f111a] hover:bg-[#3db8b8]"
                        : "bg-slate-700 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    保存
                  </button>
                </div>
              ) : (
                <p
                  className={`text-xl font-medium ${user.deletedFlg ? "text-slate-500 line-through" : "text-slate-100"}`}
                >
                  {user.nickName || user.userName}
                </p>
              )}
            </div>

            {/* ユーザーネーム */}
            <div>
              <label className="text-xs font-mono text-[#4fd1d1] uppercase tracking-widest mb-1 block">
                ユーザーネーム
              </label>
              <p className="text-lg text-slate-200 font-medium">{user.userName}</p>
            </div>

            {/* メールアドレス */}
            <div>
              <label className="text-xs font-mono text-[#4fd1d1] uppercase tracking-widest mb-1 block">
                メールアドレス
              </label>
              <p className="text-lg text-slate-400 font-medium">{user.email}</p>
            </div>

            {/* パスワード変更ボタン */}
            {!isGoogleUser && (
              <div className="h-12 flex items-end border-t border-slate-700/50 mt-4">
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  disabled={isActionLoading || !user.isActive || user.deletedFlg}
                  className="flex items-center gap-2 text-sm text-[#4fd1d1] hover:text-white transition-colors group disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <LinkIcon size={14} />
                  <span className="border-b border-[#4fd1d1] group-hover:border-white">パスワードを変更する</span>
                </button>
              </div>
            )}
          </div>

          {/* 管理者用操作パネル */}
          {isAdminMode && (
            <div className="pt-6 border-t border-slate-700/60 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* アクティブ / 非アクティブ 切替ボタン */}
                <button
                  onClick={handleDeactivate}
                  disabled={isActionLoading || user.deletedFlg}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border disabled:opacity-20 disabled:cursor-not-allowed ${
                    user.isActive
                      ? "bg-amber-600/10 hover:bg-amber-600 border-amber-600/40 hover:border-amber-500 text-amber-400 hover:text-white"
                      : "bg-emerald-600/10 hover:bg-emerald-600 border-emerald-600/40 hover:border-emerald-500 text-emerald-400 hover:text-white"
                  }`}
                >
                  {isActionLoading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : user.isActive ? (
                    <>
                      <span>非アクティブにする</span>
                    </>
                  ) : (
                    <>
                      <span>アクティブにする</span>
                    </>
                  )}
                </button>

                {/* 削除ボタン */}
                <button
                  onClick={handleLogicalDelete}
                  disabled={isActionLoading || user.deletedFlg}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border disabled:opacity-20 disabled:cursor-not-allowed ${
                    user.deletedFlg
                      ? "bg-slate-800 text-slate-500 border-slate-700"
                      : "bg-red-600/10 hover:bg-red-600 border-red-600/40 hover:border-red-500 text-red-400 hover:text-white"
                  }`}
                >
                  {isActionLoading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : user.deletedFlg ? (
                    <span>削除済み（復元不可）</span>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>削除する</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* パスワード変更モーダル */}
      {isPasswordModalOpen && <PasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />}
    </>
  );
}
