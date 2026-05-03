"use client";

import { useState, Suspense } from "react";
import { DungeonCardList } from "@/app/(pages)/_components/list/DungeonCardList";
import { SortDropdown, SortOption, SortOrder } from "@/app/(pages)/_components/SortDropdown";
import { usegetPlayHistoryByUser } from "@/app/_hooks";
import { useSearchParams } from "next/navigation";
import { DungeonDetailModal } from "@/app/(pages)/_components/detail/DungeonDetailModal";
import { DungeonDetailContent } from "@/app/(pages)/_components/detail/DungeonDetailContent";
import { ProfileCard } from "./_components/ProfileCard";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <ProfileCard />
    </Suspense>
  );
}
