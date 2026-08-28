import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import ColumnDropZone from "./ColumnDropZone";
import TaskCard from "./TaskCard";
import InlineEditField from "./InlineEditField";
import { Statuss, Task } from "./types";
import useDeleteStatus from "../hooks/deleteStatusHook";
import useUpdateStatus from "../hooks/updateStatusHook";
import { useAppStore } from "../store/useAppStore";

interface SortableColumnProps {
  column: Statuss;
  isFilteredActive: boolean;
  tasks: Task[];
}

const getStatusColorKey = (
  name?: string,
): "todo" | "in-progress" | "done" | "custom" => {
  if (!name) return "custom";
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "");
  if (normalized === "todo" || normalized === "to-do") return "todo";
  if (normalized === "inprogress" || normalized === "in-progress")
    return "in-progress";
  if (normalized === "done") return "done";
  return "custom";
};

const SortableColumn = ({
  column,
  isFilteredActive,
  tasks,
}: SortableColumnProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const { activeProject, activeTab, statuses, setStatuses } = useAppStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `col-${column.id}`,
    data: {
      type: "Column",
      column,
    },
    disabled: isEditingName,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const projectId = activeProject?.id ?? "";
  const deleteStatusMutation = useDeleteStatus(projectId);
  const updateStatusMutation = useUpdateStatus(projectId);
  const isDefaultColumn =
    column.isDefault ?? (column as any).is_default ?? false;

  const handleRenameColumn = (newName: string) => {
    const trimmed = newName.trim();
    setIsEditingName(false);

    if (!trimmed || trimmed === column.name) return;

    updateStatusMutation.mutate(
      {
        status: {
          id: column.id,
          name: trimmed,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Column renamed to ${trimmed} successfully!`);
          if (statuses) {
            setStatuses(
              statuses.map((s) =>
                s.id === column.id ? { ...s, name: trimmed } : s,
              ),
            );
          }
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || "Failed to rename column",
          );
        },
      },
    );
  };

  const handleDeleteColumn = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (tasks.length > 0) {
      toast.error("Cannot delete a column that contains tasks.");
      return;
    }

    deleteStatusMutation.mutate(column.id, {
      onSuccess: () => {
        if (statuses) {
          setStatuses(statuses.filter((s) => s.id !== column.id));
        }
        toast.success(`Column "${column.name}" deleted successfully!`);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete column");
      },
    });
  };

  const statusColorKey = getStatusColorKey(column.name);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`column column-${statusColorKey} ${
        activeTab === column.id ? "column-active" : ""
      }`}
      {...attributes}
    >
      <div className="column-header column-header-desktop" {...listeners}>
        <div className="column-header-left">
          <span className={`status-dot status-dot-${statusColorKey}`} />

          {isDefaultColumn ? (
            <span className="column-name-static">{column.name}</span>
          ) : (
            <div
              className="column-title-inline-wrapper"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={() => setIsEditingName(true)}
            >
              <InlineEditField
                value={column.name}
                type="text"
                initialIsEditing={isEditingName}
                placeholder="Column name..."
                onSave={handleRenameColumn}
                onCancel={() => setIsEditingName(false)}
              />
            </div>
          )}

          <span className="column-count">{tasks.length}</span>
        </div>

        {!isDefaultColumn && !isEditingName && (
          <button
            type="button"
            className="column-delete-btn"
            data-tooltip={`Delete ${column.name}`}
            disabled={deleteStatusMutation.isPending}
            data-tooltip-pos="left"
            onClick={handleDeleteColumn}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {deleteStatusMutation.isPending ? (
              <Loader2 size={13} className="spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        )}
      </div>

      <ColumnDropZone status={column.id as any} statusColorKey={statusColorKey}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="column-empty">
            {isFilteredActive ? "No matching tasks" : "Drop a task here"}
          </p>
        )}
      </ColumnDropZone>
    </div>
  );
};

export default SortableColumn;
