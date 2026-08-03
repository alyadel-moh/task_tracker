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
} from "lucide-react";
import { toast } from "react-hot-toast";
import InlineEditField from "../components/InlineEditField";
import useUpdateTask from "../hooks/updateTaskHook";
import useGetTask from "../hooks/getTaskHook";
import "../css/TaskDetailsPage.css";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "in-review", label: "In Review" },
  { value: "done", label: "Done" },
];

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

  const saveField = (field: string, value: string) => {
    setSavingField(field);

    // Format value according to field requirements
    let formattedValue: any = value;
    if (field === "estimatedTime") {
      formattedValue = Number(value) || null;
    } else if (field === "dueDate") {
      formattedValue = value || null;
    } else if (field === "description") {
      formattedValue = value ?? "";
    }

    // Build fresh payload directly from current task state
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
                </div>
                <InlineEditField
                  label=""
                  type="date"
                  value={task.dueDate ?? ""}
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
