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
  Calendar,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import "../css/CreateProjectModal.css";
import "../css/TaskModal.css";
import useCreateTask from "../hooks/createTaskHook";
import useGetStatuses from "../hooks/getAllStatusesHook";

interface CreateTaskModalProps {
  projectId: string;
  onClose: () => void;
}

const schema = z.object({
  name: z.string().min(1, { message: "Task title is required" }),
  description: z.string().optional(),
  statusId: z.string().min(1, { message: "Status is required" }),
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
  const { data: statuses = [] } = useGetStatuses(projectId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<SchemaInput, any, SchemaOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      statusId: "",
      priority: "MEDIUM",
      estimatedTime: undefined,
      dueDate: null,
    },
  });

  useEffect(() => {
    if (statuses.length > 0) {
      const defaultCol = statuses.find((s: any) => s.isDefault) ?? statuses[0];
      if (defaultCol?.id) {
        setValue("statusId", defaultCol.id);
      }
    }
  }, [statuses, setValue]);

  const onSubmit = (data: SchemaOutput) => {
    createtaskmutation.mutate(
      {
        name: data.name.trim(),
        description: data.description ?? "",
        statusId: data.statusId,
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
          <div className="modal-header-icon task-modal-header-icon">
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
        <p className="modal-subtitle modal-subtitle-compact">
          Add a task to this project's board.
        </p>

        <form
          className="modal-form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
        >
          {/* Title Field */}
          <div className="field">
            <span className="field-label">Title</span>
            <div className="input-with-icon">
              <Tag size={15} className="input-icon" />
              <input
                type="text"
                placeholder="e.g. Design landing page hero"
                autoFocus
                className={errors.name ? "input-error" : ""}
                {...register("name")}
              />
            </div>
            {errors.name && (
              <small className="field-error">{errors.name.message}</small>
            )}
          </div>

          {/* Description Field */}
          <div className="field">
            <span className="field-label">
              Description{" "}
              <span className="field-label-optional">(optional)</span>
            </span>
            <div className="input-with-icon textarea-wrapper">
              <FileText size={15} className="input-icon textarea-icon" />
              <textarea
                placeholder="Add more detail about this task"
                rows={3}
                {...register("description")}
              />
            </div>
          </div>

          {/* Status & Priority Row */}
          <div className="field-row">
            <div className="field">
              <span className="field-label">Status</span>
              <div className="input-with-icon select-wrapper">
                <CheckSquare size={15} className="input-icon" />
                <select {...register("statusId")}>
                  {statuses.map((col: any) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <span className="field-label">Priority</span>
              <div className="input-with-icon select-wrapper">
                <AlertCircle size={15} className="input-icon" />
                <select {...register("priority")}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Estimated Time & Due Date Row */}
          <div className="field-row">
            <div className="field">
              <span className="field-label">
                Estimated time{" "}
                <span className="field-label-optional">(minutes)</span>
              </span>
              <div className="input-with-icon">
                <Clock size={15} className="input-icon" />
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 120"
                  {...register("estimatedTime")}
                />
              </div>
            </div>

            <div className="field">
              <span className="field-label">
                Due date{" "}
                <span className="field-label-optional">(optional)</span>
              </span>
              <div className="input-with-icon">
                <Calendar size={15} className="input-icon" />
                <input
                  type="datetime-local"
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  {...register("dueDate")}
                />
              </div>
            </div>
          </div>

          {/* Full Width Submit Button */}
          <div className="modal-actions-full">
            <button
              type="submit"
              className="modal-button modal-button-primary modal-button-full"
              disabled={createtaskmutation.isPending}
            >
              {createtaskmutation.isPending ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Creating...</span>
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
