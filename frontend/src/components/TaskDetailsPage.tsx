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
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import InlineEditField from "../components/InlineEditField";
import useUpdateTask from "../hooks/updateTaskHook";
import useGetTask from "../hooks/getTaskHook";
import useGetTimeEntries from "../hooks/getalltimeEntries";
import useCreateTimeEntry from "../hooks/createTimeEntry";
import useUpdateTimeEntry from "../hooks/updateTimentry";
import useDeleteTimeEntry from "../hooks/deleteTimentry";
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

const formatDateOnly = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

const formatForDateInput = (value: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const TaskDetailsPage = () => {
  const navigate = useNavigate();
  const [savingField, setSavingField] = useState<string | null>(null);
  const [savingEntryField, setSavingEntryField] = useState<string | null>(null);

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newDuration, setNewDuration] = useState("");
  const [newEntryDate, setNewEntryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newNote, setNewNote] = useState("");

  const projectId = useParams<{ projectId: string }>().projectId ?? "";
  const taskId = useParams<{ taskId: string }>().taskId ?? "";

  const { data: task, isLoading: taskLoading } = useGetTask(projectId, taskId);
  const { data: timeEntriesData, isLoading: entriesLoading } =
    useGetTimeEntries(taskId);

  const updateTaskMutation = useUpdateTask(projectId);
  const createEntryMutation = useCreateTimeEntry(taskId);
  const updateEntryMutation = useUpdateTimeEntry(taskId, projectId);
  const deleteEntryMutation = useDeleteTimeEntry(taskId);

  if (!task && (taskLoading || entriesLoading)) {
    return (
      <div className="task-page-loading">
        <Loader2 size={24} className="spin" />
      </div>
    );
  }

  if (!task) return null;

  const entries = timeEntriesData?.timeEntries || [];
  const totalMinutes = timeEntriesData?.totalMinutes || 0;

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
    if (field === "durationMinutes") {
      formattedValue = value ? Number(value) : null;
    } else if (field === "dueDate") {
      formattedValue = value ? new Date(value).toISOString() : null;
    } else if (field === "description") {
      formattedValue = value ?? "";
    }

    updateTaskMutation.mutate(
      {
        id: task.id,
        [field]: formattedValue,
      },
      {
        onSuccess: (res: any) => {
          const backendMessage = res?.message || res?.data?.message;
          if (backendMessage) {
            toast.success(backendMessage, { id: "task-save" });
          }
          setSavingField(null);
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || error?.message;
          if (errorMessage) {
            toast.error(errorMessage, { id: "task-save" });
          }
          setSavingField(null);
        },
      },
    );
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDuration || Number(newDuration) <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }

    createEntryMutation.mutate(
      {
        durationMinutes: Number(newDuration),
        entryDate: newEntryDate,
        note: newNote || undefined,
        taskId: taskId,
      },
      {
        onSuccess: () => {
          toast.success("Time entry logged");
          setNewDuration("");
          setNewNote("");
          setShowAddEntry(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to log time");
        },
      },
    );
  };

  const saveEntryField = (entryId: string, field: string, value: string) => {
    const key = `${entryId}-${field}`;
    setSavingEntryField(key);

    let updatedVal: any = value;
    if (field === "durationMinutes") updatedVal = Number(value);

    updateEntryMutation.mutate(
      {
        id: entryId,
        [field]: updatedVal,
      },
      {
        onSuccess: (res: any) => {
          const backendMessage = res?.message || res?.data?.message;
          if (backendMessage) {
            toast.success(backendMessage, { id: "entry-save" });
          } else {
            toast.success("Entry updated", { id: "entry-save" });
          }
          setSavingEntryField(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to update entry");
          setSavingEntryField(null);
        },
      },
    );
  };

  const handleDeleteEntry = (entryId: string) => {
    deleteEntryMutation.mutate(entryId, {
      onSuccess: () => {
        toast.success("Time entry deleted");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete entry");
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

        {/* 2-Column Main Split Wrapper */}
        <div className="task-page-split">
          {/* Left Column: Task Details */}
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
                          PRIORITY_OPTIONS.find(
                            (o) => o.value === task.priority,
                          )?.label
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
                    value={formatForDateTimeInput(task.dueDate ?? null)}
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
                      task.estimatedTime != null
                        ? String(task.estimatedTime)
                        : ""
                    }
                    displayValue={
                      task.estimatedTime != null
                        ? `${task.estimatedTime} mins`
                        : undefined
                    }
                    placeholder="e.g. 60"
                    isSaving={savingField === "estimatedTime"}
                    onSave={(v) => saveField("estimatedTime", v)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Time Entries */}
          <div className="task-page-card time-entries-card">
            <div className="task-page-card-header">
              <div className="task-page-header-left">
                <div className="task-page-icon-wrapper entries-icon-wrapper">
                  <Clock size={22} className="task-page-icon" />
                </div>
                <div>
                  <h2 className="task-page-main-title">Time Entries</h2>
                  <span className="entries-total-subtext">
                    Total: {totalMinutes} mins
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="add-entry-btn"
                onClick={() => setShowAddEntry(!showAddEntry)}
              >
                <Plus size={16} />
                <span>Log Time</span>
              </button>
            </div>

            {/* Optional Create Entry Form */}
            {showAddEntry && (
              <form className="add-entry-form" onSubmit={handleCreateEntry}>
                <div className="add-entry-row">
                  <div className="add-entry-field">
                    <label>Duration (mins)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 45"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                    />
                  </div>

                  <div className="add-entry-field">
                    <label>Date</label>
                    <input
                      type="date"
                      required
                      value={newEntryDate}
                      onChange={(e) => setNewEntryDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="add-entry-field">
                  <label>Note (optional)</label>
                  <input
                    type="text"
                    placeholder="What did you work on?"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                </div>

                <div className="add-entry-actions">
                  <button
                    type="button"
                    className="inline-field-action inline-field-cancel"
                    onClick={() => setShowAddEntry(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-field-action inline-field-save"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* List of Time Entries */}
            <div className="entries-list">
              {entries.length === 0 ? (
                <div className="entries-empty">
                  <Clock size={32} />
                  <p>No time entries logged yet.</p>
                </div>
              ) : (
                entries.map((entry: any) => {
                  const createdAtVal = entry.createdAt || entry.created_at;
                  const updatedAtVal = entry.updatedAt || entry.updated_at;

                  return (
                    <div className="entry-row" key={entry.id}>
                      <div className="entry-main">
                        {/* Entry Timestamp Meta Badge */}
                        {createdAtVal && (
                          <div
                            className="task-page-meta-badge"
                            style={{
                              alignSelf: "flex-start",
                              marginBottom: "10px",
                              fontSize: "11px",
                              padding: "4px 10px",
                            }}
                          >
                            <span>Created {formatTimestamp(createdAtVal)}</span>
                            {updatedAtVal && updatedAtVal !== createdAtVal && (
                              <span>
                                {" "}
                                • Updated {formatTimestamp(updatedAtVal)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Top Row: Duration and Date side-by-side */}
                        <div className="entry-row-header">
                          {/* Duration Inline Edit */}
                          <div className="entry-field entry-duration">
                            <div className="task-field-label-with-icon">
                              <Clock size={13} className="field-icon" />
                              <span>Duration</span>
                            </div>
                            <InlineEditField
                              label=""
                              type="number"
                              value={String(entry.durationMinutes)}
                              displayValue={`${entry.durationMinutes} mins`}
                              isSaving={
                                savingEntryField ===
                                `${entry.id}-durationMinutes`
                              }
                              onSave={(v) =>
                                saveEntryField(entry.id, "durationMinutes", v)
                              }
                            />
                          </div>

                          {/* Entry Date Inline Edit */}
                          <div className="entry-field entry-date">
                            <div className="task-field-label-with-icon">
                              <Calendar size={13} className="field-icon" />
                              <span>Date</span>
                            </div>
                            <InlineEditField
                              label=""
                              type="date"
                              value={formatForDateInput(
                                entry.entry_date || entry.entryDate,
                              )}
                              displayValue={formatDateOnly(
                                entry.entry_date || entry.entryDate,
                              )}
                              isSaving={
                                savingEntryField === `${entry.id}-entryDate`
                              }
                              onSave={(v) =>
                                saveEntryField(entry.id, "entryDate", v)
                              }
                            />
                          </div>
                        </div>

                        {/* Divider */}
                        <hr className="entry-card-divider" />

                        {/* Bottom Row: Note */}
                        <div className="entry-field entry-note">
                          <div className="task-field-label-with-icon">
                            <FileText size={13} className="field-icon" />
                            <span>Note</span>
                          </div>
                          <InlineEditField
                            label=""
                            optional
                            placeholder="No note added"
                            value={entry.note ?? ""}
                            isSaving={savingEntryField === `${entry.id}-note`}
                            onSave={(v) => saveEntryField(entry.id, "note", v)}
                          />
                        </div>
                      </div>

                      {/* Trash Delete Action Button on Hover */}
                      <button
                        type="button"
                        className="entry-delete-btn"
                        title="Delete time entry"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsPage;
