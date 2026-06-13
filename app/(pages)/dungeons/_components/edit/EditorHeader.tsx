import { FieldErrors } from "react-hook-form";
import { DungeonStatus } from "@prisma/client";
import { EditorInfoForm } from "./EditorInfoForm";
import { EditorActionBar } from "./EditorActionBar";

type Props = {
  cols: number;
  rows: number;
  config: {
    name: string;
    description: string;
    timeLimit: number;
  };
  status: DungeonStatus;
  errors: FieldErrors;
  isDirty: boolean;
  isEditMode: boolean;
  isAdmin: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onConfigChange: (key: string, value: string | number, shouldDirty: boolean) => void;
  onSizeChange: (r: number, c: number) => void;
  onCancel: () => void;
  onSave: () => void;
  onTestPlay: () => void;
  onDeleteClick: (physical: boolean) => void;
};

export const EditorHeader = (props: Props) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 mb-6 select-none flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      {/* 左側：インフォメーション入力ブロック */}
      <EditorInfoForm
        status={props.status}
        config={props.config}
        errors={props.errors}
        onConfigChange={props.onConfigChange}
        onCancel={props.onCancel}
      />

      {/* 右側：コントロール・アクションブロック */}
      <EditorActionBar
        cols={props.cols}
        rows={props.rows}
        isDirty={props.isDirty}
        isEditMode={props.isEditMode}
        isAdmin={props.isAdmin}
        isSaving={props.isSaving}
        isDeleting={props.isDeleting}
        status={props.status}
        onSizeChange={props.onSizeChange}
        onSave={props.onSave}
        onTestPlay={props.onTestPlay}
        onDeleteClick={props.onDeleteClick}
      />
    </div>
  );
};
