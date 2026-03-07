import { DungeonStatus } from "@prisma/client"; // EnumをPrismaからインポート

export interface CreateDungeonRequest {
  name: string;
  code: string; // ユニークな識別子
  userId: string; // 作成者のユーザーID
  mapData: any; // Json型に対応（具体的なマップ構造があればその型）
  mapSizeHeight: number;
  mapSizeWidth: number;
  createdBy: string;
  updatedBy: string;

  // --- 任意項目（省略時はデフォルト値が使用される想定） ---
  description?: string;
  timeLimit?: number; // default: 60
  difficulty?: number; // default: 1
  status?: DungeonStatus; // default: DRAFT
  isTemplate?: boolean; // default: false

  // --- タグ情報（IDの配列で受け取るのが一般的です） ---
  tagIds?: number[];
}
