import { useState, useEffect, useMemo, useRef } from "react";
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
  User as UserIcon,
  Users,
  Check,
  UserCheck,
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
import useGetProjectMembers from "../hooks/getAllprojectMembers";
import "../css/TaskDetailsPage.css";
import { Priority, ProjectMember } from "./types";
import { useAppStore } from "../store/useAppStore";
const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const formatStatusLabel = (name?: string | null): string => {
  if (!name) return "Unknown";
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

const formatForDateTimeInput = (
  value: string | Date | null | undefined,
): string => {
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

const getInitials = (name?: string | null): string => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
export const getStatusColorKey = (
  name?: string,
): "todo" | "in-progress" | "done" | "custom" => {
  if (!name) return "custom";
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "");
  if (normalized === "todo" || normalized === "to-do") return "todo";
  if (normalized === "inprogress" || normalized === "in-progress")
    return "in-progress";
  if (normalized === "done") return "done";
  return "custom";
};
interface EntryFormState {
  durationMinutes: string;
  entryDate: string;
  note: string;
}

const TaskDetailsPage = () => {
  const navigate = useNavigate();
  const [savingTask, setSavingTask] = useState(false);
  const { user, statuses } = useAppStore();

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newDuration, setNewDuration] = useState("");
  const [newEntryDate, setNewEntryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newNote, setNewNote] = useState("");
  const [overrun, setOverrun] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  const [taskDraft, setTaskDraft] = useState({
    name: "",
    description: "",
    statusId: "",
    priority: "LOW" as Priority,
    dueDate: "",
    estimatedTime: "",
    statusName: "",
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

  const { data: projectMembers = [] } = useGetProjectMembers(projectId);

  const updateTaskMutation = useUpdateTask(projectId);
  const createEntryMutation = useCreateTimeEntry(taskId);
  const updateEntryMutation = useUpdateTimeEntry(taskId);
  const deleteEntryMutation = useDeleteTimeEntry(taskId);

  const entries = timeEntriesData?.timeEntries || [];
  const totalMinutes = timeEntriesData?.totalMinutes || 0;
  const isTaskCreator = Boolean(task?.creator?.id === user?.id);
  const isTaskAssignee = (task?.assignees || []).some(
    (a: any) => (a.id || a.userId) === user?.id,
  );
  const canManageAssignees = isTaskCreator || isTaskAssignee;
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAssigneeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    if (task?.estimatedTime && totalMinutes > task.estimatedTime) {
      setOverrun(true);
    }
  }, [task?.estimatedTime, totalMinutes]);

  const statusOptions = useMemo(() => {
    return statuses?.map((s: any) => ({
      value: s.id,
      label: formatStatusLabel(s.name),
      name: s.name,
    }));
  }, [statuses]);

  const isTaskDirty = useMemo(() => {
    if (!task) return false;
    return (
      taskDraft.name.trim() !== (task.name || "").trim() ||
      taskDraft.description.trim() !== (task.description || "").trim() ||
      taskDraft.statusId !== (task.statusId || "") ||
      taskDraft.priority !== (task.priority || "LOW") ||
      taskDraft.dueDate !== formatForDateTimeInput(task.dueDate) ||
      taskDraft.estimatedTime !==
        (task.estimatedTime != null ? String(task.estimatedTime) : "")
    );
  }, [taskDraft, task]);

  const currentStatusLabel = useMemo(() => {
    const matched = statusOptions?.find(
      (opt) => opt.value === taskDraft.statusId,
    );
    return matched
      ? matched.label
      : formatStatusLabel(
          taskDraft.statusName || task?.statusName || "Unknown",
        );
  }, [
    statusOptions,
    taskDraft.statusId,
    taskDraft.statusName,
    task?.statusName,
  ]);

  const assignableMembers = useMemo(() => {
    return projectMembers.filter((m: any) => m.user?.id !== task?.creator?.id);
  }, [projectMembers, task?.creator?.id]);

  useEffect(() => {
    if (task) {
      setTaskDraft({
        name: task.name || "",
        description: task.description || "",
        statusId: task.statusId || "",
        priority: task.priority || "LOW",
        dueDate: formatForDateTimeInput(task.dueDate),
        estimatedTime:
          task.estimatedTime != null ? String(task.estimatedTime) : "",
        statusName: task.statusName || "",
      });
    }
  }, [task]);

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
    task.statusName !== "Done" &&
    task.statusName !== "DONE" &&
    new Date(task.dueDate) < new Date();

  const getDueLabel = (): string | null => {
    if (
      !task.dueDate ||
      task.statusName === "Done" ||
      task.statusName === "DONE"
    )
      return null;

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

  const handleStatusChange = (selectedStatusId: string) => {
    const matchedStatus = statusOptions?.find(
      (opt) => opt.value === selectedStatusId,
    );
    setTaskDraft((prev) => ({
      ...prev,
      statusId: selectedStatusId,
      statusName: matchedStatus ? matchedStatus.name : prev.statusName,
    }));
  };

  const handleSaveAllTaskChanges = () => {
    if (!taskDraft.name.trim()) {
      toast.error("Task name cannot be empty");
      return;
    }

    setSavingTask(true);

    updateTaskMutation.mutate(
      {
        id: taskId,
        name: taskDraft.name.trim(),
        description: taskDraft.description.trim()
          ? taskDraft.description.trim()
          : null,
        statusId: taskDraft.statusId,
        priority: taskDraft.priority,
        dueDate: taskDraft.dueDate ? new Date(taskDraft.dueDate) : null,
        estimatedTime: taskDraft.estimatedTime
          ? Number(taskDraft.estimatedTime)
          : null,
      },
      {
        onSuccess: (res: any) => {
          const backendMessage = res?.message || res?.data?.message;
          setOverrun(res?.overrun || false);
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

  const handleToggleAssignee = (member: ProjectMember) => {
    const currentAssigneeIds = (task.assignees || []).map((a: any) => a.id);
    const isAlreadyAssigned = currentAssigneeIds.includes(member.user.id);

    const updatedAssigneeIds = isAlreadyAssigned
      ? currentAssigneeIds.filter((id: string) => id !== member.user.id)
      : [...currentAssigneeIds, member.user.id];

    updateTaskMutation.mutate(
      {
        id: task.id,
        assigneeIds: updatedAssigneeIds,
      },
      {
        onSuccess: () => {
          toast.success(
            isAlreadyAssigned
              ? `Removed ${member.user.name}`
              : `Assigned ${member.user.name}`,
            { id: "assignee-toggle" },
          );
          setShowAssigneeDropdown(false);
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || "Failed to update assignee",
            { id: "assignee-toggle" },
          );
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
          setOverrun(res.overrun || false);
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
        const overrunResult = res?.overrun ?? false;
        setOverrun(overrunResult);
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

        {/* Top Section: Compact Creator & Assignees */}
        <div className="task-people-section">
          {/* Creator Card */}
          <div className="task-creator-card">
            <div className="task-people-header">
              <UserIcon size={13} className="people-header-icon" />
              <span>Created by</span>
            </div>
            <div className="task-user-chip">
              <div className="task-avatar-wrapper">
                {task.creator?.photoUrl ? (
                  <img
                    src={task.creator.photoUrl}
                    alt={task.creator.name || "Creator"}
                    className="task-avatar-img"
                  />
                ) : (
                  <div className="task-avatar-fallback">
                    {getInitials(task.creator?.name)}
                  </div>
                )}
              </div>
              <div className="task-user-info">
                <span className="task-user-name">
                  {task.creator?.name || "Anonymous User"}
                </span>
                <span className="task-user-email">
                  {task.creator?.email || "No email available"}
                </span>
              </div>
            </div>
          </div>

          {/* Assignees Card with Add Dropdown */}
          <div className="task-assignees-container">
            <div className="task-people-header">
              <div className="task-people-header-left">
                <Users size={13} className="people-header-icon" />
                <span>Assignees</span>
                <span className="task-count-badge">
                  {task.assignees?.length || 0}
                </span>
              </div>

              <div
                className="add-assignee-menu-wrapper"
                ref={assigneeDropdownRef}
              >
                {canManageAssignees && (
                  <button
                    type="button"
                    className="add-assignee-trigger-btn"
                    onClick={() => setShowAssigneeDropdown((prev) => !prev)}
                    aria-label="Manage assignees"
                  >
                    <UserCheck size={14} />
                    <span>Manage Assignees</span>
                  </button>
                )}
                {showAssigneeDropdown && (
                  <div className="assignee-dropdown-menu">
                    <div className="assignee-dropdown-list">
                      {assignableMembers.length === 0 ? (
                        <div className="assignee-dropdown-empty">
                          No members found
                        </div>
                      ) : (
                        assignableMembers.map((member: any) => {
                          const isAssigned = task.assignees?.some(
                            (a: any) => a.id === member.user?.id,
                          );

                          return (
                            <button
                              key={member.id}
                              type="button"
                              className={`assignee-dropdown-item ${
                                isAssigned ? "is-assigned" : ""
                              }`}
                              onClick={() => handleToggleAssignee(member)}
                            >
                              <div className="task-avatar-wrapper small">
                                {member.user?.photoUrl ? (
                                  <img
                                    src={member.user.photoUrl}
                                    alt={member.user.name}
                                    className="task-avatar-img"
                                  />
                                ) : (
                                  <div className="task-avatar-fallback">
                                    {getInitials(member.user?.name)}
                                  </div>
                                )}
                              </div>
                              <div className="assignee-dropdown-user-info">
                                <span className="assignee-dropdown-name">
                                  {member.user?.name}
                                </span>
                                <span className="assignee-dropdown-email">
                                  {member.user?.email}
                                </span>
                              </div>
                              {isAssigned && (
                                <Check size={14} className="assigned-check" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="task-assignees-scroll">
              {!task.assignees || task.assignees.length === 0 ? (
                <div className="task-assignees-empty">
                  No assignees assigned
                </div>
              ) : (
                task.assignees.map((assignee: any) => (
                  <div className="task-assignee-card" key={assignee.id}>
                    <div className="task-avatar-wrapper">
                      {assignee.photoUrl ? (
                        <img
                          src={assignee.photoUrl}
                          alt={assignee.name}
                          className="task-avatar-img"
                        />
                      ) : (
                        <div className="task-avatar-fallback">
                          {getInitials(assignee.name)}
                        </div>
                      )}
                    </div>
                    <div className="task-user-info">
                      <span className="task-user-name">{assignee.name}</span>
                      <span className="task-user-email">{assignee.email}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Split Wrapper */}
        <div className="task-page-split">
          {/* Left Column: Task Details */}
          <div
            className="task-page-card"
            data-priority={taskDraft.priority}
            data-status-color={getStatusColorKey(
              taskDraft.statusName || task?.statusName,
            )}
          >
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
                  readOnly={!canManageAssignees}
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
                  readOnly={!canManageAssignees}
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
                    options={statusOptions}
                    value={taskDraft.statusId}
                    displayValue={
                      <span
                        className="task-badge badge-status"
                        data-status={taskDraft.statusName || task?.statusName}
                      >
                        <span className="badge-status-dot" />
                        {currentStatusLabel}
                      </span>
                    }
                    onSave={handleStatusChange}
                    readOnly={!canManageAssignees}
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
                        <span className="badge-priority-dot" />
                        {
                          PRIORITY_OPTIONS.find(
                            (o) => o.value === taskDraft.priority,
                          )?.label
                        }
                      </span>
                    }
                    onSave={(v) => updateTaskDraft("priority", v)}
                    readOnly={!canManageAssignees}
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
                    readOnly={!canManageAssignees}
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
                    readOnly={!canManageAssignees}
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

          {/* Right Column: Time Entries */}
          <div className="task-page-card time-entries-card">
            <div className="task-page-card-header">
              <div className="task-page-header-left">
                <div className="task-page-icon-wrapper entries-icon-wrapper">
                  <Clock size={22} className="task-page-icon" />
                </div>
                <div>
                  <h2 className="task-page-main-title">Time Entries</h2>
                </div>
              </div>
              {overrun && (
                <span className="entries-overrun-badge">
                  <AlertTriangle size={12} />
                  Exceeds estimated time
                </span>
              )}
              {canManageAssignees && (
                <button
                  type="button"
                  className="add-entry-btn"
                  onClick={() => setShowAddEntry(!showAddEntry)}
                >
                  <Plus size={16} />
                  <span>Log Time</span>
                </button>
              )}
            </div>

            <div className="time-budget-bar-wrapper">
              <div className="time-budget-bar-track">
                <div
                  className={`time-budget-bar-fill ${
                    task.estimatedTime
                      ? totalMinutes / task.estimatedTime > 1
                        ? "over"
                        : totalMinutes / task.estimatedTime > 0.85
                          ? "caution"
                          : "safe"
                      : "safe"
                  }`}
                  style={{
                    width: task.estimatedTime
                      ? `${Math.min(
                          (totalMinutes / task.estimatedTime) * 100,
                          100,
                        )}%`
                      : "6%",
                  }}
                />
              </div>
              <div className="time-budget-bar-labels">
                <span>{totalMinutes} mins logged</span>
                {task.estimatedTime ? (
                  <span>{task.estimatedTime} mins budgeted</span>
                ) : (
                  <span>No estimate set</span>
                )}
              </div>
            </div>

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
                              readOnly={!canManageAssignees}
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
                              readOnly={!canManageAssignees}
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
                            readOnly={!canManageAssignees}
                          />
                        </div>

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
                      {canManageAssignees && (
                        <button
                          type="button"
                          className="entry-delete-btn"
                          data-tooltip="delete time entry"
                          data-tooltip-pos="left"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
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
