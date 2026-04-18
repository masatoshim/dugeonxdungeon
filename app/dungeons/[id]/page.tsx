import { DungeonDetailContent } from "@/app/dungeons/_components/detail/DungeonDetailContent";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#0f172a] p-8">
      <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-12 shadow-2xl">
        <DungeonDetailContent id={id} />
      </div>
    </main>
  );
}
