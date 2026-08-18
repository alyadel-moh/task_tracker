import React, { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import InlineEditField from "./InlineEditField";
import useCreateStatus from "../hooks/createStatusHook";

interface AddColumnInlineProps {
  projectId: string;
  placeholder?: string;
  buttonLabel?: string;
  onSuccess?: () => void;
  className?: string;
}

const AddColumnInline: React.FC<AddColumnInlineProps> = ({
  projectId,
  placeholder = "Column name...",
  buttonLabel = "Add column",
  onSuccess,
  className = "",
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const createStatusMutation = useCreateStatus(projectId);

  const handleCreate = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setIsAdding(false);
      return;
    }

    createStatusMutation.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          toast.success("Column added successfully!");
          setIsAdding(false);
          onSuccess?.();
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || "Failed to create column",
          );
        },
      },
    );
  };

  return (
    <div className={`column add-column-wrapper ${className}`}>
      <div className="column-header column-header-desktop add-column-header-spacer">
        <span className="status-dot" style={{ opacity: 0 }} />
        <span style={{ opacity: 0 }}>{buttonLabel}</span>
      </div>

      <div className="column-drop-zone add-column-drop-zone">
        {isAdding ? (
          <InlineEditField
            value=""
            type="text"
            initialIsEditing={true}
            placeholder={placeholder}
            onSave={handleCreate}
            onCancel={() => setIsAdding(false)}
          />
        ) : (
          <button
            type="button"
            className="add-column-button"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={14} />
            <span>{buttonLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AddColumnInline;
