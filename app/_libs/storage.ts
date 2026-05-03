"use server";

import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// サーバーサイドからSupabase Storageの署名付きURLを発行する
export async function getSignedAvatarUrl(imageKey: string): Promise<string | null> {
  try {
    // 署名付きURLを生成
    const { data, error } = await supabaseAdmin.storage
      .from("profile_thumbnail") // バケット名
      .createSignedUrl(imageKey, 300); // 有効期限（秒）

    if (error) {
      console.error("Error creating signed URL:", error.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Unexpected error fetching signed URL:", err);
    return null;
  }
}

export async function deleteOldImage(path: string) {
  const { data, error } = await supabaseAdmin.storage.from("profile_thumbnail").remove([path]);

  if (error) throw error;
  return data;
}
