"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";
import { supabase } from "@/app/_libs/supabase";
import { Camera, Pencil, Link as LinkIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useGetUser, useUpdateUser } from "@/app/_hooks";
import { getSignedAvatarUrl, deleteOldImage } from "@/app/_libs/storage";
import { PasswordChangeModal } from "./PasswordChangeModal";

export function ProfileCard() {
  const { data: session, update: updateSession } = useSession();
  const userId = session?.user?.id;
  const { user, mutate } = useGetUser(userId);
  const { update } = useUpdateUser(userId!);

  const [isEditingNickName, setIsEditingNickName] = useState(false);
  const [nickName, setNickName] = useState("");
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isNickNameChanged = user && nickName !== (user.nickName || user.userName);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // 初期値の同期
  useEffect(() => {
    if (user) {
      setNickName(user.nickName || user.userName);

      // iconImageKeyがある場合、署名付きURLを取得
      if (user.iconImageKey) {
        getSignedAvatarUrl(user.iconImageKey).then(setThumbnailImageUrl);
      }
    }
  }, [user]);

  if (!session || !user) return null;

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

      const newUrl = await getSignedAvatarUrl(data.path);
      setThumbnailImageUrl(newUrl);
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

  return (
    <>
      <div className="bg-[#1a1d2b] border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-xl min-h-[580px] flex flex-col relative">
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#4fd1d1]/20 bg-slate-800  items-center justify-center relative">
              {isUploading ? (
                <Loader2 className="animate-spin text-[#4fd1d1]" />
              ) : thumbnailImageUrl ? (
                <Image
                  src={thumbnailImageUrl}
                  alt="avatar"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="text-slate-500 text-xs text-center p-2">No Image</div>
              )}
            </div>

            <label className="absolute bottom-0 right-0 p-2 bg-[#4fd1d1] hover:bg-[#3db8b8] rounded-full cursor-pointer transition-colors shadow-lg">
              <Camera size={18} className="text-[#0f111a]" />
              <input
                type="file"
                className="hidden"
                onChange={handleImageChange}
                accept="image/*"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          {/* ニックネーム */}
          <div>
            <label className="flex items-center gap-2 text-xs font-mono text-[#4fd1d1] uppercase tracking-widest mb-1">
              ニックネーム
              <button
                onClick={() => setIsEditingNickName(!isEditingNickName)}
                className="hover:text-white transition-colors"
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
                  disabled={!isNickNameChanged}
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
              <p className="text-xl font-medium text-slate-100 text-white">{user.nickName || user.userName}</p>
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
                onClick={() => setIsPasswordModalOpen(true)} // モーダルを開く
                className="flex items-center gap-2 text-sm text-[#4fd1d1] hover:text-white transition-colors group"
              >
                <LinkIcon size={14} />
                <span className="border-b border-[#4fd1d1] group-hover:border-white">パスワードを変更する</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {/* パスワード変更モーダル */}
      {isPasswordModalOpen && <PasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />}
    </>
  );
}
