import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ColumnDropZone from "./ColumnDropZone";
import TaskCard from "./TaskCard";
import { Task } from "./types";
import { ColumnStatus } from "./DashboardBoard";

interface SortableColumnProps {
  column: ColumnStatus;
  tasks: Task[];
  activeTab: string;
  isFilteredActive: boolean;
}

const SortableColumn = ({
  column,
  tasks,
  activeTab,
  isFilteredActive,
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

  const statusClassModifier = (column.mappedStatus || "DEFAULT").toLowerCase();

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
        <span className={`status-dot status-dot-${statusClassModifier}`} />
        <span>{column.name}</span>
        <span className="column-count">{tasks.length}</span>
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