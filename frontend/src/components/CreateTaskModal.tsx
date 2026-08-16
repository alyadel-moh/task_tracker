import { useEffect } from "react";
import {
  X,
  ListPlus,
  Loader2,
  Tag,
  FileText,
  CheckSquare,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import "../css/CreateProjectModal.css";
import "../css/TaskModal.css";
import useCreateTask from "../hooks/createTaskHook";

interface CreateTaskModalProps {
  projectId: string;
  onClose: () => void;
}

const schema = z.object({
  name: z.string().min(1, { message: "Task title is required" }),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  estimatedTime: z.preprocess(
    (val) =>
      val === "" || val === null || Number.isNaN(val) ? undefined : Number(val),
    z.number().min(0).optional(),
  ),
  dueDate: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .optional()
    .nullable(),
});

type SchemaInput = z.input<typeof schema>;
type SchemaOutput = z.output<typeof schema>;

const CreateTaskModal = ({ onClose, projectId }: CreateTaskModalProps) => {
  const createtaskmutation = useCreateTask(projectId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SchemaInput, any, SchemaOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      estimatedTime: undefined,
      dueDate: null,
    },
  });

  const onSubmit = (data: SchemaOutput) => {
    createtaskmutation.mutate(
      {
        name: data.name,
        description: data.description ?? "",
        status: data.status,
        priority: data.priority,
        estimatedTime: data.estimatedTime ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      },
      {
        onSuccess: () => {
          toast.success("Task created successfully!");
          reset();
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
          {/* Title Field */}
          <label className="field">
            <span className="field-label">Title</span>
            <div className="field-input-wrapper">
              <Tag size={15} className="input-inside-icon" />
              <input
                type="text"
                placeholder="e.g. Design landing page hero"
                autoFocus
                {...register("name")}
              />
            </div>
            {errors.name && (
              <small className="field-error">{errors.name.message}</small>
            )}
          </label>

          {/* Description Field */}
          <label className="field">
            <span className="field-label">
              Description{" "}
              <span className="field-label-optional">(optional)</span>
            </span>
            <div className="field-input-wrapper textarea-wrapper">
              <FileText size={15} className="input-inside-icon textarea-icon" />
              <textarea
                placeholder="Add more detail about this task"
                rows={3}
                {...register("description")}
              />
            </div>
          </label>

          {/* Status & Priority Row */}
          <div className="field-row">
            <label className="field">
              <span className="field-label">Status</span>
              <div className="field-input-wrapper">
                <CheckSquare size={15} className="input-inside-icon" />
                <select {...register("status")}>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </label>

            <label className="field">
              <span className="field-label">Priority</span>
              <div className="field-input-wrapper">
                <AlertCircle size={15} className="input-inside-icon" />
                <select {...register("priority")}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </label>
          </div>

          {/* Estimated Time & Due Date Row */}
          <div className="field-row">
            <label className="field">
              <span className="field-label">
                Estimated time{" "}
                <span className="field-label-optional">(minutes)</span>
              </span>
              <div className="field-input-wrapper">
                <Clock size={15} className="input-inside-icon" />
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 120"
                  {...register("estimatedTime")}
                />
              </div>
            </label>

            <label className="field">
              <span className="field-label">
                Due date{" "}
                <span className="field-label-optional">(optional)</span>
              </span>
              <input
                type="datetime-local"
                className="date-input-standalone"
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                {...register("dueDate")}
              />
            </label>
          </div>

          {/* Action Button */}
          <div className="modal-actions">
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
