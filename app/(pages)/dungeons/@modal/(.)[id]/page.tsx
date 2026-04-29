import { DungeonDetailModal } from "@/app/(pages)/dungeons/_components/detail/DungeonDetailModal";
import { DungeonDetailContent } from "@/app/(pages)/dungeons/_components/detail/DungeonDetailContent";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <DungeonDetailModal>
      <DungeonDetailContent id={id} />
    </DungeonDetailModal>
  );
}
