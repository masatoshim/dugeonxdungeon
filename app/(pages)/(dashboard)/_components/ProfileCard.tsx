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
import { UserResponse } from "@/app/_types";
import { toast } from "sonner";

interface ProfileCardProps {
  user: UserResponse;
  mutate: () => void;
  update: (data: Partial<UserResponse>) => Promise<UserResponse>;
  remove?: (data: Partial<void>) => Promise<void>;
  isAdminMode?: boolean;
}

const MAX_NICKNAME_LENGTH = 20;

export function ProfileCard({ user, mutate, update, remove, isAdminMode }: ProfileCardProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isEditingNickName, setIsEditingNickName] = useState(false);
  const [nickName, setNickName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // 処理用のローディング状態
  const [isActionLoading, setIsActionLoading] = useState(false);

  // 確認モーダルの状態管理
  const [confirmModalType, setConfirmModalType] = useState<"deactivate" | "delete" | null>(null);

  const trimmedNickName = nickName.trim();
  const isNickNameChanged = user && nickName !== (user.nickName || user.userName);
  const isNickNameValid = trimmedNickName.length > 0 && trimmedNickName.length <= MAX_NICKNAME_LENGTH;
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
      console.error("エラーが発生しました: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ニックネーム更新処理
  const handleUpdateNickName = async () => {
    if (!isNickNameValid) return;

    try {
      await update({ nickName: trimmedNickName });
      await updateSession({ nickName: trimmedNickName });
      setIsEditingNickName(false);
      mutate();
    } catch (error) {
      toast.error("更新に失敗しました");
    }
  };

  // アクティブ切替の実行
  const executeDeactivate = async () => {
    const nextActiveState = !user.isActive;
    const actionText = nextActiveState ? "アクティブ化" : "非アクティブ化";

    setIsActionLoading(true);
    try {
      await update({
        isActive: nextActiveState,
      });
      mutate();
      toast.success(`ユーザーを${actionText}にしました。`);
    } catch (error) {
      console.error(error);
      toast.error("処理に失敗しました。");
    } finally {
      setIsActionLoading(false);
      setConfirmModalType(null);
    }
  };

  // 削除の実行
  const executeLogicalDelete = async () => {
    setIsActionLoading(true);
    try {
      if (remove) {
        await remove();
      }
      mutate();
      toast.success("ユーザーを削除しました。");
    } catch (error) {
      console.error(error);
      toast.error("削除処理に失敗しました。");
    } finally {
      setIsActionLoading(false);
      setConfirmModalType(null);
    }
  };

  const handleConfirmAction = () => {
    if (confirmModalType === "deactivate") {
      executeDeactivate();
    } else if (confirmModalType === "delete") {
      executeLogicalDelete();
    }
  };

  const nextActiveState = !user.isActive;
  const actionText = nextActiveState ? "アクティブ化" : "非アクティブ化";

  return (
    <>
      <div className="bg-[#1a1d2b] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl h-full flex flex-col justify-between relative">
        {/* ユーザーステータス */}
        {isAdminMode && (
          <div className="absolute top-4 left-4 z-10">
            {user.deletedFlg ? (
              /* 削除済みの場合 */
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-red-500/10 text-red-400 border-red-500/20">
                <AlertTriangle size={10} />
                <span>削除済み</span>
              </span>
            ) : user.isActive ? (
              /* アクティブの場合 */
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>アクティブ</span>
              </span>
            ) : (
              /* 非アクティブの場合 */
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>非アクティブ</span>
              </span>
            )}
          </div>
        )}

        <div>
          {/* アイコン */}
          <div className="flex flex-col items-center my-4">
            <div className="relative group">
              <div
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 bg-slate-800 flex items-center justify-center relative ${
                  user.deletedFlg ? "border-red-500/50" : "border-[#4fd1d1]/30 shadow-[0_0_15px_rgba(79,209,209,0.15)]"
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
                <label
                  className={`absolute bottom-0 right-0 p-2.5 rounded-full shadow-lg transition-all ${
                    isUploading || isActionLoading || !user.isActive
                      ? "bg-slate-700 cursor-not-allowed opacity-50"
                      : "bg-[#4fd1d1] hover:bg-[#3db8b8] cursor-pointer hover:scale-105"
                  }`}
                >
                  <Camera size={16} className="text-[#0f111a]" />
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

          {/* ユーザー情報リスト */}
          <div className="space-y-5 mt-6">
            {/* ニックネーム */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-mono text-[#4fd1d1] uppercase tracking-widest mb-1">
                ニックネーム
                <button
                  onClick={() => setIsEditingNickName(!isEditingNickName)}
                  className="flex items-center gap-1 bg-slate-800/80 hover:bg-[#4fd1d1]/20 border border-slate-700/80 hover:border-[#4fd1d1]/50 px-2 py-0.5 rounded-md text-slate-300 hover:text-[#4fd1d1] transition-all"
                  disabled={isActionLoading || !user.isActive || user.deletedFlg}
                  title="ニックネームを編集"
                >
                  <Pencil size={11} />
                  <span className="text-[10px] font-sans">編集</span>
                </button>
              </label>
              {isEditingNickName ? (
                <div className="mt-1 space-y-1">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={nickName}
                      onChange={(e) => setNickName(e.target.value)}
                      maxLength={MAX_NICKNAME_LENGTH}
                      className="w-full sm:flex-1 min-w-0 bg-slate-800/80 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#4fd1d1]"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateNickName}
                      disabled={
                        !isNickNameChanged || !isNickNameValid || isActionLoading || !user.isActive || user.deletedFlg
                      }
                      className={`w-full sm:w-auto shrink-0 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                        isNickNameChanged && isNickNameValid
                          ? "bg-[#4fd1d1] text-[#0f111a] hover:bg-[#3db8b8]"
                          : "bg-slate-700 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      保存
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[10px] px-1">
                    <span className={trimmedNickName.length === 0 ? "text-red-400" : "text-slate-400"}>
                      {trimmedNickName.length === 0 ? "1文字以上入力してください" : ""}
                    </span>
                    <span className="font-mono text-slate-400 ml-auto">
                      {nickName.length} / {MAX_NICKNAME_LENGTH}
                    </span>
                  </div>
                </div>
              ) : (
                <p
                  className={`text-lg font-semibold truncate ${user.deletedFlg ? "text-slate-500 line-through" : "text-slate-100"}`}
                >
                  {user.nickName || user.userName}
                </p>
              )}
            </div>

            {/* ユーザーネーム */}
            <div>
              <label className="text-[11px] font-mono text-[#4fd1d1] uppercase tracking-widest mb-1 block">
                ユーザーネーム
              </label>
              <p className="text-base text-slate-200 font-medium truncate">{user.userName}</p>
            </div>

            {/* メールアドレス */}
            <div>
              <label className="text-[11px] font-mono text-[#4fd1d1] uppercase tracking-widest mb-1 block">
                メールアドレス
              </label>
              <p className="text-base text-slate-300 font-medium truncate">{user.email}</p>
            </div>

            {/* パスワード変更ボタン */}
            {!isGoogleUser && (
              <div className="pt-2">
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  disabled={isActionLoading || !user.isActive || user.deletedFlg}
                  className="inline-flex items-center gap-2 text-xs text-[#4fd1d1] hover:text-white transition-colors group disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <LinkIcon size={13} />
                  <span className="border-b border-[#4fd1d1] group-hover:border-white pb-0.5">
                    パスワードを変更する
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 管理者用操作パネル */}
        {isAdminMode && (
          <div className="pt-6 mt-6 border-t border-slate-700/60">
            <div className="grid grid-cols-2 gap-2.5">
              {/* アクティブ / 非アクティブ 切替ボタン */}
              <button
                onClick={() => setConfirmModalType("deactivate")}
                disabled={isActionLoading || user.deletedFlg}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border disabled:opacity-20 disabled:cursor-not-allowed ${
                  user.isActive
                    ? "bg-amber-600/10 hover:bg-amber-600 border-amber-600/40 hover:border-amber-500 text-amber-400 hover:text-white"
                    : "bg-emerald-600/10 hover:bg-emerald-600 border-emerald-600/40 hover:border-emerald-500 text-emerald-400 hover:text-white"
                }`}
              >
                {isActionLoading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : user.isActive ? (
                  <span>非アクティブにする</span>
                ) : (
                  <span>アクティブにする</span>
                )}
              </button>

              {/* 削除ボタン */}
              <button
                onClick={() => setConfirmModalType("delete")}
                disabled={isActionLoading || user.deletedFlg}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border disabled:opacity-20 disabled:cursor-not-allowed ${
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

        {/* 統合確認モーダル */}
        {confirmModalType !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white">
                {confirmModalType === "deactivate" ? "ステータス変更の確認" : "ユーザー削除の確認"}
              </h3>
              <p className="text-sm text-slate-300">
                {confirmModalType === "deactivate"
                  ? `ユーザー「${user.nickName || user.userName}」を${actionText}にしますか？`
                  : `⚠️【警告】ユーザー「${user.nickName || user.userName}」を削除しますか？\nこの操作は画面上から取り消すことができません。`}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModalType(null)}
                  disabled={isActionLoading}
                  className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isActionLoading}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-colors shadow-lg disabled:opacity-50 ${
                    confirmModalType === "deactivate"
                      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30"
                      : "bg-red-600 hover:bg-red-500 shadow-red-900/30"
                  }`}
                >
                  {isActionLoading ? "処理中..." : "削除する"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* パスワード変更モーダル */}
        {isPasswordModalOpen && <PasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />}
      </div>
    </>
  );
}
