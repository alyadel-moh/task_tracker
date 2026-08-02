import { useDraggable } from "@dnd-kit/core";
import { Calendar, Check, Clock, AlertTriangle, Pencil } from "lucide-react";
import { type Priority, type Task } from "./types";

const priorityLabel: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

const TaskCard = ({ task, onEdit }: TaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { status: task.status },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const isOverdue =
    task.dueDate &&
    task.status !== "done" &&
    new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${task.status === "done" ? "task-card-done" : ""} ${
        isDragging ? "task-card-dragging" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="task-card-top">
        <p className="task-title">{task.name}</p>

        <div className="task-card-icons">
          <button
            type="button"
            className="task-edit-button"
            aria-label={`Edit ${task.name}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil size={13} aria-hidden="true" />
          </button>
          {task.dueDate && (
            <span
              className={`task-status-icon ${isOverdue ? "task-status-icon-overdue" : ""}`}
              title={isOverdue ? "Overdue" : "Due date set"}
            >
              {isOverdue ? (
                <AlertTriangle size={14} aria-hidden="true" />
              ) : (
                <Clock size={14} aria-hidden="true" />
              )}
            </span>
          )}
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        {task.status === "done" ? (
          <span className="badge badge-done">
            <Check size={11} aria-hidden="true" />
            Done
          </span>
        ) : (
          <span className={`badge badge-${task.priority}`}>
            {priorityLabel[task.priority]}
          </span>
        )}

        {task.dueDate && (
          <span className={`task-due ${isOverdue ? "task-due-overdue" : ""}`}>
            <Calendar size={12} aria-hidden="true" />
            {task.dueDate}
          </span>
        )}

        {task.estimatedTime && (
          <span className="task-due">
            <Clock size={12} aria-hidden="true" />
            {task.estimatedTime}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
