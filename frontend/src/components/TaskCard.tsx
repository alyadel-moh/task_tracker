import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Check,
  Clock,
  AlertTriangle,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { type Priority, type Task } from "./types";
import useDeleteTask from "../hooks/deletetaskHook";

const priorityLabel: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

interface TaskCardProps {
  task: Task;
  refetchTasks?: () => void;
}

const TaskCard = ({ task, refetchTasks }: TaskCardProps) => {
  const navigate = useNavigate();
  const deleteTaskMutation = useDeleteTask(task.projectId, task.id);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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
    task.status !== "DONE" &&
    new Date(task.dueDate) < new Date(new Date().toDateString());

  const getDueLabel = (): string | null => {
    if (!task.dueDate || task.status === "DONE") return null;

    const today = new Date(new Date().toDateString());
    const due = new Date(task.dueDate);
    const diffDays = Math.round(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays}d`;
  };

  const dueLabel = getDueLabel();

  const getDueUrgency = (): "overdue" | "today" | "upcoming" | null => {
    if (!dueLabel) return null;
    if (isOverdue) return "overdue";
    if (dueLabel === "Due today") return "today";
    return "upcoming";
  };

  const dueUrgency = getDueUrgency();

  const handleDelete = () => {
    deleteTaskMutation.mutate(undefined, {
      onSuccess: () => {
        toast.dismiss();
        toast.success(
          deleteTaskMutation.data?.message ?? "Task deleted successfully!",
        );
        refetchTasks?.();
        setIsConfirmingDelete(false);
      },
      onError: (error: any) => {
        toast.dismiss();
        toast.error(
          error?.response?.data?.message ??
            "Failed to delete task. Please try again.",
        );
      },
    });
  };

  const handleCardClick = () => {
    navigate(`/dashboard/${task.projectId}/task/${task.id}`);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`task-card ${task.status === "DONE" ? "task-card-done" : ""} ${
          isDragging ? "task-card-dragging" : ""
        }`}
        {...attributes}
        {...listeners}
        onClick={handleCardClick}
      >
        <div className="task-card-top">
          <p className="task-title">{task.name}</p>

          <div className="task-card-icons">
            <button
              type="button"
              className="task-delete-button"
              aria-label={`Delete ${task.name}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setIsConfirmingDelete(true);
              }}
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>

            {dueLabel && (
              <span className={`task-due-label task-due-label-${dueUrgency}`}>
                {isOverdue ? (
                  <AlertTriangle size={12} aria-hidden="true" />
                ) : (
                  <Clock size={12} aria-hidden="true" />
                )}
                <span>{dueLabel}</span>
              </span>
            )}
          </div>
        </div>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        <div className="task-meta">
          {task.status === "DONE" ? (
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
              {new Date(task.dueDate).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
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

      {/* Delete Confirmation Modal */}
      {isConfirmingDelete && (
        <div
          className="modal-overlay"
          onClick={() => setIsConfirmingDelete(false)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon modal-header-icon-danger">
                <AlertTriangle size={18} aria-hidden="true" />
              </div>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setIsConfirmingDelete(false)}
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="modal-title">Delete "{task.name}"?</h2>
            <p className="modal-subtitle">
              This permanently deletes the task, including its time entries and
              history. This can't be undone.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-button modal-button-secondary"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={deleteTaskMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-button modal-button-danger"
                onClick={handleDelete}
                disabled={deleteTaskMutation.isPending}
              >
                {deleteTaskMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} aria-hidden="true" />
                    Delete permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskCard;
