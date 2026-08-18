import { useEffect, useState, useRef } from "react";
import {
  X,
  ListPlus,
  Loader2,
  Tag,
  FileText,
  CheckSquare,
  AlertCircle,
  Clock,
  ChevronDown,
  Check,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
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

const formatStatusName = (name: string): string => {
  const normalized = name.trim().toUpperCase();
  if (normalized === "TODO" || normalized === "TO_DO") return "To Do";
  if (normalized === "IN_PROGRESS" || normalized === "INPROGRESS")
    return "In Progress";
  if (normalized === "DONE") return "Done";

  return name
    .toLowerCase()
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface CustomDropdownProps {
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  error?: boolean;
}

const CustomDropdown = ({
  options,
  value,
  onChange,
  icon,
  placeholder = "Select...",
  error = false,
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-select-container" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? "active" : ""} ${
          error ? "input-error" : ""
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="custom-select-trigger-content">
          {icon && <span className="custom-select-icon">{icon}</span>}
          <span className="custom-select-value">
            {selected ? selected.name : placeholder}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`custom-select-chevron ${isOpen ? "rotated" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="custom-select-menu">
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <div
                key={option.id}
                className={`custom-select-item ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
              >
                <span>{option.name}</span>
                {isSelected && <Check size={14} className="check-icon" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CreateTaskModal = ({ onClose, projectId }: CreateTaskModalProps) => {
  const createtaskmutation = useCreateTask(projectId);
  const { data: statuses = [] } = useGetStatuses(projectId);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
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

  const selectedStatusId = watch("statusId");

  useEffect(() => {
    if (statuses.length > 0 && !selectedStatusId) {
      const defaultCol = statuses.find((s: any) => s.isDefault) ?? statuses[0];
      if (defaultCol?.id) {
        setValue("statusId", defaultCol.id, { shouldValidate: true });
      }
    }
  }, [statuses, setValue, selectedStatusId]);

  const formattedStatuses = statuses.map((col: any) => ({
    id: col.id,
    name: formatStatusName(col.name),
  }));

  const priorityOptions = [
    { id: "LOW", name: "Low" },
    { id: "MEDIUM", name: "Medium" },
    { id: "HIGH", name: "High" },
  ];

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

          {/* Description Field (Top-aligned icon & proper padding) */}
          <div className="field">
            <span className="field-label">
              Description{" "}
              <span className="field-label-optional">(optional)</span>
            </span>
            <div className="textarea-wrapper">
              <FileText size={15} className="textarea-icon" />
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
              <Controller
                control={control}
                name="statusId"
                render={({ field }) => (
                  <CustomDropdown
                    options={formattedStatuses}
                    value={field.value}
                    onChange={field.onChange}
                    icon={<CheckSquare size={15} />}
                    error={!!errors.statusId}
                    placeholder="Select status"
                  />
                )}
              />
              {errors.statusId && (
                <small className="field-error">{errors.statusId.message}</small>
              )}
            </div>

            <div className="field">
              <span className="field-label">Priority</span>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <CustomDropdown
                    options={priorityOptions}
                    value={field.value}
                    onChange={field.onChange}
                    icon={<AlertCircle size={15} />}
                    placeholder="Select priority"
                  />
                )}
              />
            </div>
          </div>

          {/* Estimated Time & Due Date Row (Left icon removed from Due Date) */}
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
                  className={errors.estimatedTime ? "input-error" : ""}
                  {...register("estimatedTime")}
                />
              </div>
              {errors.estimatedTime && (
                <small className="field-error">
                  {errors.estimatedTime.message}
                </small>
              )}
            </div>

            <div className="field">
              <span className="field-label">
                Due date{" "}
                <span className="field-label-optional">(optional)</span>
              </span>
              <input
                type="datetime-local"
                className="due-date-input"
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                {...register("dueDate")}
              />
            </div>
          </div>

          {/* Submit Button */}
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
