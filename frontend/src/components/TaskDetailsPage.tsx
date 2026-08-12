import { useState, useEffect, useMemo } from "react";
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
  History,
  Save,
} from "lucide-react";
import { toast } from "react-hot-toast";
import InlineEditField from "../components/InlineEditField";
import TaskHistoryDrawer from "../components/TaskHistoryDrawer";
import useUpdateTask from "../hooks/updateTaskHook";
import useGetTask from "../hooks/getTaskHook";
import useGetTimeEntries from "../hooks/getAlltimeEntries";
import useCreateTimeEntry from "../hooks/createTimeEntry";
import useUpdateTimeEntry from "../hooks/updateTimeEntry";
import useDeleteTimeEntry from "../hooks/deleteTimeEntry";
import "../css/TaskDetailsPage.css";
import { Priority, Status } from "./types";

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

const formatDateOnly = (value: string | Date | null): string => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatForDateTimeInput = (value: string | Date | null): string => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatForDateInput = (value: string | Date | null): string => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

interface EntryFormState {
  durationMinutes: string;
  entryDate: string;
  note: string;
}

const TaskDetailsPage = () => {
  const navigate = useNavigate();
  const [savingTask, setSavingTask] = useState(false);

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newDuration, setNewDuration] = useState("");
  const [newEntryDate, setNewEntryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newNote, setNewNote] = useState("");
  const [overrun, setoverrun] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [taskDraft, setTaskDraft] = useState({
    name: "",
    description: "",
    status: "TODO",
    priority: "LOW",
    dueDate: "",
    estimatedTime: "",
  });

  const [entryDrafts, setEntryDrafts] = useState<
    Record<string, EntryFormState>
  >({});
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);

  const projectId = useParams<{ projectId: string }>().projectId ?? "";
  const taskId = useParams<{ taskId: string }>().taskId ?? "";

  const { data: task, isLoading: taskLoading } = useGetTask(projectId, taskId);
  const { data: timeEntriesData, isLoading: entriesLoading } =
    useGetTimeEntries(taskId);

  const updateTaskMutation = useUpdateTask(projectId);
  const createEntryMutation = useCreateTimeEntry(taskId);
  const updateEntryMutation = useUpdateTimeEntry(taskId);
  const deleteEntryMutation = useDeleteTimeEntry(taskId);
  const entries = timeEntriesData?.timeEntries || [];
  const totalMinutes = timeEntriesData?.totalMinutes || 0;

  // Sync server task into local draft state
  useEffect(() => {
    if (task) {
      setTaskDraft({
        name: task.name || "",
        description: task.description || "",
        status: task.status || "TODO",
        priority: task.priority || "LOW",
        dueDate: formatForDateTimeInput(task.dueDate || null),
        estimatedTime:
          task.estimatedTime != null ? String(task.estimatedTime) : "",
      });
    }
  }, [task]);

  // Sync server time entries into local draft states
  useEffect(() => {
    if (timeEntriesData?.timeEntries?.length) {
      const initialDrafts: Record<string, EntryFormState> = {};
      timeEntriesData.timeEntries.forEach((entry: any) => {
        initialDrafts[entry.id] = {
          durationMinutes: String(entry.durationMinutes || ""),
          entryDate: formatForDateInput(entry.entry_date || entry.entryDate),
          note: entry.note || "",
        };
      });
      setEntryDrafts(initialDrafts);
    }
  }, [timeEntriesData]);

  const isTaskDirty = useMemo(() => {
    if (!task) return false;
    return (
      taskDraft.name.trim() !== (task.name || "").trim() ||
      taskDraft.description.trim() !== (task.description || "").trim() ||
      taskDraft.status !== (task.status || "TODO") ||
      taskDraft.priority !== (task.priority || "LOW") ||
      taskDraft.dueDate !== formatForDateTimeInput(task.dueDate || null) ||
      taskDraft.estimatedTime !==
        (task.estimatedTime != null ? String(task.estimatedTime) : "")
    );
  }, [taskDraft, task]);

  if (!task && (taskLoading || entriesLoading)) {
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
  const dueUrgency = !dueLabel
    ? null
    : isOverdue
      ? "overdue"
      : dueLabel === "Due today"
        ? "today"
        : "upcoming";

  const updateTaskDraft = (field: string, value: string) => {
    setTaskDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAllTaskChanges = () => {
    if (!taskDraft.name.trim()) {
      toast.error("Task name cannot be empty");
      return;
    }

    setSavingTask(true);

    updateTaskMutation.mutate(
      {
        task: {
          id: taskId,
          name: taskDraft.name.trim(),
          description: taskDraft.description.trim()
            ? taskDraft.description.trim()
            : null,
          status: taskDraft.status as Status,
          priority: taskDraft.priority as Priority,
          dueDate: taskDraft.dueDate ? new Date(taskDraft.dueDate) : null,
          estimatedTime: taskDraft.estimatedTime
            ? Number(taskDraft.estimatedTime)
            : null,
        },
      },
      {
        onSuccess: (res: any) => {
          const backendMessage = res?.message || res?.data?.message;
          setoverrun(res?.overrun || false);
          toast.success(backendMessage || "Task changes saved successfully", {
            id: "task-save",
          });
          setSavingTask(false);
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || "Failed to save task changes",
            { id: "task-save" },
          );
          setSavingTask(false);
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
        onSuccess: (res) => {
          const backendMessage = res?.message || null;
          toast.success(backendMessage);
          setoverrun(res.overrun || false);
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

  const handleEntryDraftChange = (
    entryId: string,
    field: keyof EntryFormState,
    value: string,
  ) => {
    setEntryDrafts((prev) => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value,
      },
    }));
  };

  const handleSaveEntry = (entry: any) => {
    const draft = entryDrafts[entry.id];
    if (!draft) return;

    setSavingEntryId(entry.id);

    const payload: any = {
      id: entry.id,
      durationMinutes: Number(draft.durationMinutes),
      entryDate: draft.entryDate,
      note: draft.note || null,
    };

    updateEntryMutation.mutate(payload, {
      onSuccess: (res: any) => {
        const backendMessage = res?.message || res?.data?.message;
        const overrun = res?.overrun ?? false;
        setoverrun(overrun);
        toast.success(backendMessage || "Entry updated successfully", {
          id: "entry-save",
        });
        setSavingEntryId(null);
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.message || "Failed to update time entry",
        );
        setSavingEntryId(null);
      },
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    deleteEntryMutation.mutate(entryId, {
      onSuccess: () => toast.success("Time entry deleted"),
      onError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to delete entry"),
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

          <button
            type="button"
            className="history-drawer-trigger-btn"
            onClick={() => setIsHistoryOpen(true)}
          >
            <History size={16} />
            <span>View history</span>
          </button>
        </div>

        {/* 2-Column Split Wrapper */}
        <div className="task-page-split">
          {/* Left Column: Task Details */}
          <div className="task-page-card">
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

            <div className="task-page-body">
              {/* Task Name */}
              <div className="task-page-title-field">
                <div className="task-field-label-with-icon">
                  <Tag size={14} className="field-icon" />
                  <span>Task Name</span>
                </div>
                <InlineEditField
                  label=""
                  value={taskDraft.name}
                  onSave={(v) => updateTaskDraft("name", v)}
                />
              </div>

              {/* Description */}
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
                  value={taskDraft.description}
                  placeholder="Add a detailed description..."
                  onSave={(v) => updateTaskDraft("description", v)}
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
                    value={taskDraft.status}
                    displayValue={
                      <span
                        className={`task-badge badge-status badge-status-${taskDraft.status}`}
                      >
                        {
                          STATUS_OPTIONS.find(
                            (o) => o.value === taskDraft.status,
                          )?.label
                        }
                      </span>
                    }
                    onSave={(v) => updateTaskDraft("status", v)}
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
                    value={taskDraft.priority}
                    displayValue={
                      <span
                        className={`task-badge badge-priority badge-priority-${taskDraft.priority}`}
                      >
                        {
                          PRIORITY_OPTIONS.find(
                            (o) => o.value === taskDraft.priority,
                          )?.label
                        }
                      </span>
                    }
                    onSave={(v) => updateTaskDraft("priority", v)}
                  />
                </div>

                {/* Due Date */}
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
                    value={taskDraft.dueDate}
                    displayValue={
                      taskDraft.dueDate
                        ? formatTimestamp(taskDraft.dueDate)
                        : undefined
                    }
                    onSave={(v) => updateTaskDraft("dueDate", v)}
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
                    value={taskDraft.estimatedTime}
                    displayValue={
                      taskDraft.estimatedTime
                        ? `${taskDraft.estimatedTime} mins`
                        : undefined
                    }
                    placeholder="e.g. 60"
                    onSave={(v) => updateTaskDraft("estimatedTime", v)}
                  />
                </div>
              </div>

              {isTaskDirty && (
                <div className="save-task-container">
                  <button
                    type="button"
                    className="save-task-btn"
                    disabled={savingTask}
                    onClick={handleSaveAllTaskChanges}
                  >
                    {savingTask ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    <span>Save Task Changes</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="task-page-card time-entries-card">
            <div className="task-page-card-header">
              <div className="task-page-header-left">
                <div className="task-page-icon-wrapper entries-icon-wrapper">
                  <Clock size={22} className="task-page-icon" />
                </div>
                <div>
                  <h2 className="task-page-main-title">Time Entries</h2>
                  <div className="entries-subtext-container">
                    <span className="entries-total-subtext">
                      Total: {totalMinutes} mins
                    </span>
                    {overrun && (
                      <span className="entries-overrun-badge">
                        ⚠️ Exceeds estimated time
                      </span>
                    )}
                  </div>
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
                  <label>
                    Note{" "}
                    <span className="field-label-optional">(optional)</span>
                  </label>
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
                  const createdAtVal = entry.createdAt;
                  const updatedAtVal = entry.updatedAt;
                  const draft = entryDrafts[entry.id] || {
                    durationMinutes: String(entry.durationMinutes || ""),
                    entryDate: formatForDateInput(
                      entry.entry_date || entry.entryDate,
                    ),
                    note: entry.note || "",
                  };

                  const isDirty =
                    String(entry.durationMinutes) !== draft.durationMinutes ||
                    formatForDateInput(entry.entry_date || entry.entryDate) !==
                      draft.entryDate ||
                    (entry.note || "") !== draft.note;

                  return (
                    <div className="entry-row" key={entry.id}>
                      <div className="entry-main">
                        {createdAtVal && (
                          <div className="entry-meta-badge-container">
                            <span className="entry-created-badge">
                              Created {formatTimestamp(createdAtVal)}
                              {updatedAtVal &&
                                updatedAtVal !== createdAtVal && (
                                  <span>
                                    {" "}
                                    • Updated {formatTimestamp(updatedAtVal)}
                                  </span>
                                )}
                            </span>
                          </div>
                        )}

                        <div className="entry-row-header">
                          <div className="entry-field entry-duration">
                            <div className="task-field-label-with-icon">
                              <Clock size={13} className="field-icon" />
                              <span>Duration (mins)</span>
                            </div>
                            <InlineEditField
                              label=""
                              type="number"
                              value={draft.durationMinutes}
                              displayValue={`${draft.durationMinutes} mins`}
                              onSave={(v) =>
                                handleEntryDraftChange(
                                  entry.id,
                                  "durationMinutes",
                                  v,
                                )
                              }
                            />
                          </div>

                          <div className="entry-field entry-date">
                            <div className="task-field-label-with-icon">
                              <Calendar size={13} className="field-icon" />
                              <span>Date</span>
                            </div>
                            <InlineEditField
                              label=""
                              type="date"
                              value={draft.entryDate}
                              displayValue={formatDateOnly(draft.entryDate)}
                              onSave={(v) =>
                                handleEntryDraftChange(entry.id, "entryDate", v)
                              }
                            />
                          </div>
                        </div>

                        <hr className="entry-card-divider" />

                        <div className="entry-field entry-note">
                          <div className="task-field-label-with-icon">
                            <FileText size={13} className="field-icon" />
                            <span>Note</span>
                            <span className="field-label-optional">
                              (optional)
                            </span>
                          </div>
                          <InlineEditField
                            label=""
                            optional
                            placeholder="Add a note..."
                            value={draft.note}
                            onSave={(v) =>
                              handleEntryDraftChange(entry.id, "note", v)
                            }
                          />
                        </div>

                        {/* SAVE ENTRY CHANGES BUTTON */}
                        {isDirty && (
                          <div className="save-entry-container">
                            <button
                              type="button"
                              className="save-task-btn"
                              disabled={savingEntryId === entry.id}
                              onClick={() => handleSaveEntry(entry)}
                            >
                              {savingEntryId === entry.id ? (
                                <Loader2 size={16} className="spin" />
                              ) : (
                                <Save size={16} />
                              )}
                              <span>Save Entry Changes</span>
                            </button>
                          </div>
                        )}
                      </div>

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
      <TaskHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        taskId={taskId}
      />
    </div>
  );
};
export default TaskDetailsPage;
