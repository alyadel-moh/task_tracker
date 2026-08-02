import { useEffect } from "react";
import { X, ListPlus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import "../css/CreateProjectModal.css";
import "../css/TaskModal.css";
import useCreateTask from "../hooks/createtaskHook";

interface CreateTaskModalProps {
  projectId: string;
  onClose: () => void;
  refetchTasks: () => void;
}

const schema = z.object({
  name: z.string().min(1, { message: "Task title is required" }),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  estimatedTime: z.number().min(0).optional(),
  dueDate: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

const CreateTaskModal = ({
  onClose,
  projectId,
  refetchTasks,
}: CreateTaskModalProps) => {
  const createtaskmutation = useCreateTask(projectId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    createtaskmutation.mutate(
      {
        name: data.name,
        description: data.description ?? "",
        status: data.status,
        priority: data.priority,
        estimatedTime: data.estimatedTime ?? null,
        dueDate: data.dueDate ?? null,
      },
      {
        onSuccess: () => {
          toast.success("Task created successfully!");
          reset();
          refetchTasks();
          onClose();
        },
        onError: (error: any) => {
          const apiError =
            error?.response?.data?.message ??
            "Failed to create task. Please try again.";
          toast.error(apiError);
        },
      },
    );
  };

  const onInvalid = () => {
    toast.error("Please fill in all required fields.");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon">
            <ListPlus size={18} aria-hidden="true" />
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

        <h2 id="create-task-title" className="modal-title">
          New task
        </h2>
        <p className="modal-subtitle">Add a task to this project's board.</p>

        <form
          className="modal-form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
        >
          <label className="field">
            <span className="field-label">Title</span>
            <input
              type="text"
              placeholder="e.g. Design landing page hero"
              autoFocus
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
              placeholder="Add more detail about this task"
              rows={3}
              {...register("description")}
            />
          </label>

          <label className="field">
            <span className="field-label">Priority</span>
            <select defaultValue="medium" {...register("priority")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field-label">
                Estimated time{" "}
                <span className="field-label-optional">(minutes)</span>
              </span>
              <input
                type="number"
                min="0"
                placeholder="e.g. 120"
                {...register("estimatedTime", { valueAsNumber: true })}
              />
            </label>

            <label className="field">
              <span className="field-label">
                Due date{" "}
                <span className="field-label-optional">(optional)</span>
              </span>
              <input type="date" {...register("dueDate")} />
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-button modal-button-secondary"
              onClick={onClose}
              disabled={createtaskmutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-button modal-button-primary"
              disabled={createtaskmutation.isPending}
            >
              {createtaskmutation.isPending ? (
                <>
                  <Loader2 size={14} className="spin" />
                  Creating...
                </>
              ) : (
                "Create task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
