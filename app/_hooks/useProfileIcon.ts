import { useMemo } from "react";
import { supabase } from "@/app/_libs/supabase";

export const useProfileIcon = (iconImageKey?: string | null) => {
  // useMemoを使うことで、keyが変わらない限り無駄な計算（URL生成）を避ける
  const iconUrl = useMemo(() => {
    if (!iconImageKey) return null;

    // getPublicUrlは同期的な処理なので await 不要
    const { data } = supabase.storage.from("profile_thumbnail").getPublicUrl(iconImageKey);

    return data.publicUrl;
  }, [iconImageKey]);

  return { iconUrl };
};
