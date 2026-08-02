import { useState } from "react";
import { X, CheckSquare, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import "../css/TaskDetailsModal.css";
import { Task } from "./types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import useUpdateTask from "../hooks/updateTaskHook";
import useDeleteTask from "../hooks/deletetaskHook";

const schema = z.object({
  name: z.string().min(1, { message: "Task name is required" }),
  description: z.string().optional(),
  status: z.string().min(1, { message: "Status is required" }),
  priority: z.string().min(1, { message: "Priority is required" }),
  estimatedTime: z
    .number()
    .min(0, { message: "Estimated time must be non-negative" })
    .optional(),
  dueDate: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  refetchTasks: () => void;
}

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const formatted = date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
  return formatted.replace(/ /g, "\u00A0");
};

const TaskDetailsModal = ({
  task,
  onClose,
  refetchTasks,
}: TaskDetailsModalProps) => {
  const updateTaskMutation = useUpdateTask(task.projectId);
  const deleteTaskMutation = useDeleteTask(task.projectId, task.id);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    updateTaskMutation.mutate(
      {
        id: task.id,
        name: data.name,
        description: data.description ?? "",
        status: data.status,
        priority: data.priority,
        estimatedTime: data.estimatedTime ?? null,
        dueDate: data.dueDate ?? null,
      },
      {
        onSuccess: () => {
          toast.success("Task updated successfully!");
          onClose();
          refetchTasks();
        },
        onError: (error: any) => {
          const apiError =
            error?.response?.data?.message ??
            "Failed to update task. Please try again.";
          toast.error(apiError);
        },
      },
    );
  };

  const onInvalid = () => {
    toast.error("Please fill in all required fields correctly.");
  };

  const handleDelete = () => {
    deleteTaskMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Task deleted successfully!");
        onClose();
        refetchTasks();
      },
      onError: (error: any) => {
        const apiError =
          error?.response?.data?.message ??
          "Failed to delete task. Please try again.";
        toast.error(apiError);
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        {!isConfirmingDelete ? (
          <>
            <div className="modal-header">
              <div className="modal-header-icon">
                <CheckSquare size={18} aria-hidden="true" />
              </div>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>

            <h2 id="task-details-title" className="modal-title">
              Task details
            </h2>
            <div
              className="modal-subtitle"
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                margin: "4px 0 20px",
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              <span style={{ whiteSpace: "nowrap" }}>
                Created {formatTimestamp(task.createdAt)}
              </span>
              {task.updatedAt !== task.createdAt && (
                <span style={{ whiteSpace: "nowrap" }}>
                  Updated {formatTimestamp(task.updatedAt)}
                </span>
              )}
            </div>

            <form
              className="modal-form"
              noValidate
              onSubmit={handleSubmit(onSubmit, onInvalid)}
            >
              <label className="field">
                <span className="field-label">Name</span>
                <input
                  type="text"
                  defaultValue={task.name}
                  {...register("name")}
                />
                {errors.name && (
                  <small className="field-error">{errors.name.message}</small>
                )}
              </label>

              <label className="field">
                <span className="field-label">
                  Description{" "}
                  <span className="field-label-optional">(optional)</span>
                </span>
                <textarea
                  defaultValue={task.description ?? ""}
                  placeholder="What does this task involve?"
                  rows={3}
                  {...register("description")}
                />
              </label>

              <div className="field-row">
                <label className="field">
                  <span className="field-label">Status</span>
                  <select
                    defaultValue={task.status}
                    className="field-select"
                    {...register("status")}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">Priority</span>
                  <select
                    defaultValue={task.priority}
                    className="field-select"
                    {...register("priority")}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field-row">
                <label className="field">
                  <span className="field-label">
                    Estimated time{" "}
                    <span className="field-label-optional">(hours)</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    defaultValue={task.estimatedTime ?? ""}
                    placeholder="e.g. 2"
                    {...register("estimatedTime", { valueAsNumber: true })}
                  />
                </label>

                <label className="field">
                  <span className="field-label">
                    Due date{" "}
                    <span className="field-label-optional">(optional)</span>
                  </span>
                  <input
                    type="date"
                    defaultValue={task.dueDate ?? ""}
                    {...register("dueDate")}
                  />
                </label>
              </div>

              <div className="modal-actions modal-actions-split">
                <button
                  type="button"
                  className="modal-button modal-button-danger-ghost"
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={updateTaskMutation.isPending}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete task
                </button>

                <div className="modal-actions-right">
                  <button
                    type="button"
                    className="modal-button modal-button-secondary"
                    onClick={onClose}
                    disabled={updateTaskMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-button modal-button-primary"
                    disabled={updateTaskMutation.isPending}
                  >
                    {updateTaskMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="modal-header">
              <div className="modal-header-icon modal-header-icon-danger">
                <AlertTriangle size={18} aria-hidden="true" />
              </div>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={onClose}
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
          </>
        )}
      </div>
    </div>
  );
};

export default TaskDetailsModal;
