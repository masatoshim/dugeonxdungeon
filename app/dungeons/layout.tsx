export default function DungeonsLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* メインの一覧画面（page.tsx の内容） */}
      {children}

      {/* モーダル用のスロット（@modal 内の内容） */}
      {/* 一覧から遷移した時は (.)[id]/page.tsx がここに入る。
          URL直打ちの時はここには何も入らない。
      */}
      {modal}
    </div>
  );
}
