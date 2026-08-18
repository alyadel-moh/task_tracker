import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import ColumnDropZone from "./ColumnDropZone";
import TaskCard from "./TaskCard";
import { Task, Statuss } from "./types";
import useDeleteStatus from "../hooks/deleteStatusHook";

interface SortableColumnProps {
  column: Statuss;
  tasks: Task[];
  activeTab: string;
  isFilteredActive: boolean;
  projectId: string;
}

const SortableColumn = ({
  column,
  tasks,
  activeTab,
  isFilteredActive,
  projectId,
}: SortableColumnProps) => {
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
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const deleteStatusMutation = useDeleteStatus(projectId);
  const isDefaultColumn = column.isDefault ?? false;

  const handleDeleteColumn = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (tasks.length > 0) {
      toast.error("Cannot delete a column that contains tasks.");
      return;
    }

    deleteStatusMutation.mutate(column.id, {
      onSuccess: () => {
        toast.success(`Column "${column.name}" deleted successfully!`);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete column");
      },
    });
  };

  const statusClassModifier = (column.name || "DEFAULT").toLowerCase();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`column column-${statusClassModifier} ${
        activeTab === column.id ? "column-active" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="column-header column-header-desktop">
        <div className="column-header-left">
          <span className={`status-dot status-dot-${statusClassModifier}`} />
          <span>{column.name}</span>
          <span className="column-count">{tasks.length}</span>
        </div>

        {/* Hide trash icon completely if column is default */}
        {!isDefaultColumn && (
          <button
            type="button"
            className="column-delete-btn"
            title={`Delete ${column.name}`}
            disabled={deleteStatusMutation.isPending}
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

      <ColumnDropZone status={column.id as any}>
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
