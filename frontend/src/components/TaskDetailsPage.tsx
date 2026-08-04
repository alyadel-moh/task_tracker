import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import InlineEditField from "../components/InlineEditField";
import useUpdateTask from "../hooks/updateTaskHook";
import useGetTask from "../hooks/getTaskHook";
import "../css/TaskDetailsPage.css";

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
];

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatForDateTimeInput = (value: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const TaskDetailsPage = () => {
  const navigate = useNavigate();
  const [savingField, setSavingField] = useState<string | null>(null);
  const projectId = useParams<{ projectId: string }>().projectId ?? "";
  const taskId = useParams<{ taskId: string }>().taskId ?? "";

  const { data: task, isLoading, refetch } = useGetTask(projectId, taskId);
  const updateTaskMutation = useUpdateTask(projectId);

  if (!task && isLoading) {
    return (
      <div className="task-page-loading">
        <Loader2 size={24} className="spin" />
      </div>
    );
  }

  if (!task) return null;

  const isOverdue =
    task.dueDate &&
    task.status !== "DONE" &&
    new Date(task.dueDate) < new Date();

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

  const saveField = (field: string, value: string) => {
    setSavingField(field);

    let formattedValue: any = value;
    if (field === "estimatedTime") {
      formattedValue = value ? Number(value) : null;
    } else if (field === "dueDate") {
      formattedValue = value ? new Date(value).toISOString() : null;
    } else if (field === "description") {
      formattedValue = value ?? "";
    }

    const payload = {
      id: task.id,
      name: task.name,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      estimatedTime: task.estimatedTime ?? null,
      dueDate: task.dueDate ?? null,
      [field]: formattedValue,
    };

    updateTaskMutation.mutate(payload, {
      onSuccess: (res: any) => {
        const backendMessage = res?.message || res?.data?.message;
        if (backendMessage) {
          toast.success(backendMessage, { id: "task-save" });
        }
        refetch();
        setSavingField(null);
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.message;
        if (errorMessage) {
          toast.error(errorMessage, { id: "task-save" });
        }
        setSavingField(null);
      },
    });
  };

  return (
    <div className="task-page">
      <div className="task-page-container">
        {/* Navigation Header */}
        <div className="task-page-header">
          <button
            type="button"
            className="task-page-back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            <span>Back to board</span>
          </button>
        </div>

        {/* Main Card Wrapper */}
        <div className="task-page-card">
          {/* Top Header Row */}
          <div className="task-page-card-header">
            <div className="task-page-header-left">
              <div className="task-page-icon-wrapper">
                <CheckSquare size={22} className="task-page-icon" />
              </div>
              <h2 className="task-page-main-title">Task details</h2>
            </div>

            <div className="task-page-meta-badge">
              <span>Created {formatTimestamp(task.createdAt)}</span>
              {task.updatedAt !== task.createdAt && (
                <span> • Updated {formatTimestamp(task.updatedAt)}</span>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="task-page-body">
            {/* Task Name Title with Icon */}
            <div className="task-page-title-field">
              <div className="task-field-label-with-icon">
                <Tag size={14} className="field-icon" />
                <span>Task Name</span>
              </div>
              <InlineEditField
                label=""
                value={task.name}
                isSaving={savingField === "name"}
                onSave={(v) => saveField("name", v)}
              />
            </div>

            {/* Description (Optional) */}
            <div className="task-page-field-group">
              <div className="task-field-label-with-icon">
                <FileText size={14} className="field-icon" />
                <span>Description</span>
                <span className="field-label-optional">(optional)</span>
              </div>
              <InlineEditField
                label=""
                type="textarea"
                optional
                value={task.description ?? ""}
                placeholder="Add a detailed description..."
                isSaving={savingField === "description"}
                onSave={(v) => saveField("description", v)}
              />
            </div>

            <hr className="task-page-divider" />

            {/* Grid Attributes */}
            <div className="task-page-grid">
              {/* Status */}
              <div className="task-page-grid-item">
                <div className="task-field-label-with-icon">
                  <CheckSquare size={14} className="field-icon" />
                  <span>Status</span>
                </div>
                <InlineEditField
                  label=""
                  type="select"
                  options={STATUS_OPTIONS}
                  value={task.status}
                  displayValue={
                    <span
                      className={`task-badge badge-status badge-status-${task.status}`}
                    >
                      {
                        STATUS_OPTIONS.find((o) => o.value === task.status)
                          ?.label
                      }
                    </span>
                  }
                  isSaving={savingField === "status"}
                  onSave={(v) => saveField("status", v)}
                />
              </div>

              {/* Priority */}
              <div className="task-page-grid-item">
                <div className="task-field-label-with-icon">
                  <AlertCircle size={14} className="field-icon" />
                  <span>Priority</span>
                </div>
                <InlineEditField
                  label=""
                  type="select"
                  options={PRIORITY_OPTIONS}
                  value={task.priority}
                  displayValue={
                    <span
                      className={`task-badge badge-priority badge-priority-${task.priority}`}
                    >
                      {
                        PRIORITY_OPTIONS.find((o) => o.value === task.priority)
                          ?.label
                      }
                    </span>
                  }
                  isSaving={savingField === "priority"}
                  onSave={(v) => saveField("priority", v)}
                />
              </div>

              {/* Due Date (Optional) */}
              <div className="task-page-grid-item">
                <div className="task-field-label-with-icon">
                  <Calendar size={14} className="field-icon" />
                  <span>Due Date</span>
                  <span className="field-label-optional">(optional)</span>
                  {dueLabel && (
                    <span
                      className={`task-due-label task-due-label-${dueUrgency}`}
                      style={{ marginLeft: "4px", textTransform: "none" }}
                    >
                      {isOverdue ? (
                        <AlertTriangle size={12} aria-hidden="true" />
                      ) : (
                        <Clock size={12} aria-hidden="true" />
                      )}
                      <span>{dueLabel}</span>
                    </span>
                  )}
                </div>
                <InlineEditField
                  label=""
                  type="datetime-local"
                  optional
                  placeholder="No due date set"
                  value={formatForDateTimeInput(task.dueDate)}
                  displayValue={
                    task.dueDate ? formatTimestamp(task.dueDate) : undefined
                  }
                  isSaving={savingField === "dueDate"}
                  onSave={(v) => saveField("dueDate", v)}
                />
              </div>

              {/* Estimated Time */}
              <div className="task-page-grid-item">
                <div className="task-field-label-with-icon">
                  <Clock size={14} className="field-icon" />
                  <span>Estimated Time</span>
                  <span className="field-label-optional">(minutes)</span>
                </div>
                <InlineEditField
                  label=""
                  type="number"
                  optional
                  value={
                    task.estimatedTime != null ? String(task.estimatedTime) : ""
                  }
                  displayValue={
                    task.estimatedTime != null
                      ? `${task.estimatedTime} hours`
                      : undefined
                  }
                  placeholder="e.g. 4"
                  isSaving={savingField === "estimatedTime"}
                  onSave={(v) => saveField("estimatedTime", v)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsPage;
