import {
  X,
  History,
  Plus,
  Clock,
  ArrowRightLeft,
  Trash2,
  FileText,
  Users,
  Calendar,
} from "lucide-react";
import "../css/TaskHistoryDrawer.css";
import useGetTaskHistory from "../hooks/getTaskHistoryHook";
import { HistoryEntry } from "./types";
import { useAppStore } from "../store/useAppStore";

interface TaskHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
}

interface AssigneeInfo {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
}

const FIELD_LABEL_MAP: Record<string, string> = {
  title: "Task Name",
  name: "Task Name",
  description: "Description",
  status: "Status",
  priority: "Priority",
  dueDate: "Due Date",
  estimatedTime: "Estimated Time",
  durationMinutes: "Duration",
  note: "Note",
  entryDate: "Date",
  entry_date: "Date",
  assignees: "Assignees",
};

const formatValue = (val?: string | null) => {
  if (!val) return "";

  const mappings: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Done",
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  };

  if (mappings[val]) return mappings[val];

  let cleanVal = val;
  if (cleanVal.includes(" on ")) {
    const parts = cleanVal.split(" on ");
    cleanVal = parts[0];
  }

  if (cleanVal.includes("-") && !Number.isNaN(Date.parse(cleanVal))) {
    const parsedDate = new Date(cleanVal);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  if (
    cleanVal &&
    cleanVal === cleanVal.toUpperCase() &&
    cleanVal.includes("_")
  ) {
    return cleanVal
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return cleanVal;
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// The backend stores assignee snapshots as a JSON array of
// { id, name, email, photoUrl } objects. Older rows (if any exist)
// may still be plain comma-separated names — handle both gracefully.
const parseAssigneeList = (value?: string | null): AssigneeInfo[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean).map((u: any) => ({
        id: String(u?.id ?? u?.userId ?? u?.name ?? ""),
        name: u?.name || "Unknown user",
        email: u?.email || "",
        photoUrl: u?.photoUrl || null,
      }));
    }
  } catch {
    // Legacy fallback: plain comma-separated name string
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ id: name, name, email: "", photoUrl: null }));
  }

  return [];
};

const isSameUser = (
  a: { id?: string; name?: string },
  b: { id?: string; name?: string },
) => {
  if (a.id && b.id) return a.id === b.id;
  return (
    (a.name || "").trim().toLowerCase() === (b.name || "").trim().toLowerCase()
  );
};

const renderAssigneeCards = (
  list: AssigneeInfo[],
  variant: "default" | "added" | "removed",
  currentUserId?: string,
) => {
  if (list.length === 0) {
    return (
      <span className="history-value-badge history-badge-unassigned">None</span>
    );
  }

  return (
    <div className="history-assignee-cards">
      {list.map((person) => {
        const isCurrentUser = Boolean(
          currentUserId && person.id === currentUserId,
        );

        return (
          <div
            key={person.id}
            className={`history-assignee-card history-assignee-card-${variant}`}
          >
            <div className="history-assignee-card-avatar">
              {person.photoUrl ? (
                <img src={person.photoUrl} alt={person.name} />
              ) : (
                <span>{getInitials(person.name)}</span>
              )}
            </div>
            <div className="history-assignee-card-info">
              <span className="history-assignee-card-name">
                {person.name}
                {isCurrentUser && <span className="history-you-tag">You</span>}
              </span>
              {person.email && (
                <span className="history-assignee-card-email">
                  {person.email}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const getEventIcon = (eventType: string, fieldChanged?: string | null) => {
  if (eventType === "ASSIGNEES_CHANGED" || fieldChanged === "assignees") {
    return (
      <span className="history-item-icon history-item-icon-users">
        <Users size={14} />
      </span>
    );
  }

  switch (eventType) {
    case "TASK_CREATED":
      return (
        <span className="history-item-icon history-item-icon-plus">
          <Plus size={14} />
        </span>
      );
    case "STATUS_CHANGED":
    case "FIELD_UPDATED":
      return (
        <span className="history-item-icon history-item-icon-swap">
          <ArrowRightLeft size={14} />
        </span>
      );
    case "TIME_ENTRY_CREATED":
    case "TIME_ENTRY_UPDATED":
      return (
        <span className="history-item-icon history-item-icon-clock">
          <Clock size={14} />
        </span>
      );
    case "TIME_ENTRY_DELETED":
    case "TASK_DELETED":
      return (
        <span className="history-item-icon history-item-icon-trash">
          <Trash2 size={14} />
        </span>
      );
    default:
      return (
        <span className="history-item-icon history-item-icon-file">
          <FileText size={14} />
        </span>
      );
  }
};

const formatAssigneesChange = (entry: HistoryEntry, currentUserId?: string) => {
  const actorName = entry.actor?.name || "A user";
  const actorId = (entry.actor as any)?.id;

  const beforeList = parseAssigneeList(entry.oldValue);
  const afterList = parseAssigneeList(entry.newValue);

  const added = afterList.filter((a) => !beforeList.some((b) => b.id === a.id));
  const removed = beforeList.filter(
    (b) => !afterList.some((a) => a.id === b.id),
  );

  if (added.length === 0 && removed.length === 0) {
    return (
      <span className="history-line">
        <span className="history-item-actor">{actorName}</span> updated
        assignees
      </span>
    );
  }

  if (added.length > 0 && removed.length === 0) {
    const isSelfAssign =
      added.length === 1 &&
      isSameUser(added[0], { id: actorId, name: actorName });

    if (isSelfAssign) {
      return (
        <span className="history-line">
          <span className="history-item-actor">{actorName}</span> assigned
          themselves to this task
        </span>
      );
    }

    return (
      <div className="history-desc-container">
        <span className="history-line">
          <span className="history-item-actor">{actorName}</span> assigned{" "}
          {added.length === 1 ? "someone" : `${added.length} people`} to this
          task:
        </span>
        {renderAssigneeCards(added, "added", currentUserId)}
      </div>
    );
  }

  if (removed.length > 0 && added.length === 0) {
    const isSelfRemove =
      removed.length === 1 &&
      isSameUser(removed[0], { id: actorId, name: actorName });

    if (isSelfRemove) {
      return (
        <span className="history-line">
          <span className="history-item-actor">{actorName}</span> removed
          themselves from this task
        </span>
      );
    }

    return (
      <div className="history-desc-container">
        <span className="history-line">
          <span className="history-item-actor">{actorName}</span> removed{" "}
          {removed.length === 1 ? "an assignee" : `${removed.length} assignees`}
          :
        </span>
        {renderAssigneeCards(removed, "removed", currentUserId)}
      </div>
    );
  }

  return (
    <div className="history-desc-container">
      <span className="history-line">
        <span className="history-item-actor">{actorName}</span> changed the
        assignees:
      </span>
      <div className="history-granular-diff">
        <div className="history-diff-block">
          <span className="history-diff-label added">+ Added</span>
          {renderAssigneeCards(added, "added", currentUserId)}
        </div>
        <div className="history-diff-block">
          <span className="history-diff-label removed">− Removed</span>
          {renderAssigneeCards(removed, "removed", currentUserId)}
        </div>
      </div>
    </div>
  );
};

const formatEventDescription = (
  entry: HistoryEntry,
  currentUserId?: string,
) => {
  const actorName = entry.actor?.name || "A user";
  const fieldName = entry.fieldChanged
    ? FIELD_LABEL_MAP[entry.fieldChanged] || entry.fieldChanged
    : "";

  const oldVal = formatValue(entry.oldValue);
  const newVal = formatValue(entry.newValue);

  if (
    entry.eventType === "ASSIGNEES_CHANGED" ||
    entry.fieldChanged === "assignees"
  ) {
    return formatAssigneesChange(entry, currentUserId);
  }

  if (entry.eventType === "TASK_CREATED") {
    return (
      <span className="history-line">
        <span className="history-item-actor">{actorName}</span> created this
        task
      </span>
    );
  }

  if (entry.eventType === "TIME_ENTRY_CREATED") {
    return (
      <span className="history-line">
        <span className="history-item-actor">{actorName}</span> logged a time
        entry {newVal && <span className="history-highlight">({newVal})</span>}
      </span>
    );
  }

  if (
    entry.eventType === "TIME_ENTRY_UPDATED" ||
    entry.eventType === "TIME_ENTRY_ENTRY_UPDATED"
  ) {
    if (fieldName && oldVal && newVal) {
      return (
        <span className="history-line">
          <span className="history-item-actor">{actorName}</span> updated time
          entry <span className="history-field-name">{fieldName}</span> from{" "}
          <span className="history-value-badge">{oldVal}</span> to{" "}
          <span className="history-value-badge">{newVal}</span>
        </span>
      );
    }
    if (fieldName && newVal) {
      return (
        <span className="history-line">
          <span className="history-item-actor">{actorName}</span> updated time
          entry <span className="history-field-name">{fieldName}</span> to{" "}
          <span className="history-value-badge">{newVal}</span>
        </span>
      );
    }
    return (
      <span className="history-line">
        <span className="history-item-actor">{actorName}</span> updated a time
        entry
      </span>
    );
  }

  if (entry.eventType === "TIME_ENTRY_DELETED") {
    return (
      <span className="history-line">
        <span className="history-item-actor">{actorName}</span> deleted a time
        entry
      </span>
    );
  }

  if (entry.eventType === "STATUS_CHANGED" || fieldName === "Status") {
    return (
      <span className="history-line">
        <span className="history-item-actor">{actorName}</span> moved this task
        from <span className="history-value-badge">{oldVal || "None"}</span> to{" "}
        <span className="history-value-badge">{newVal}</span>
      </span>
    );
  }

  if (fieldName) {
    if (oldVal && newVal) {
      return (
        <span className="history-line">
          <span className="history-item-actor">{actorName}</span> updated{" "}
          <span className="history-field-name">{fieldName}</span> from{" "}
          <span className="history-value-badge">{oldVal}</span> to{" "}
          <span className="history-value-badge">{newVal}</span>
        </span>
      );
    }
    if (newVal) {
      return (
        <span className="history-line">
          <span className="history-item-actor">{actorName}</span> updated{" "}
          <span className="history-field-name">{fieldName}</span> to{" "}
          <span className="history-value-badge">{newVal}</span>
        </span>
      );
    }
    return (
      <span className="history-line">
        <span className="history-item-actor">{actorName}</span> cleared{" "}
        <span className="history-field-name">{fieldName}</span>
      </span>
    );
  }

  return (
    <span className="history-line">
      <span className="history-item-actor">{actorName}</span> updated the task
    </span>
  );
};

const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const formatFullTimestamp = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dateString;
  }
};

const getGroupLabel = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";

    return date.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dateString;
  }
};

const groupHistoryByDate = (entries: HistoryEntry[]) => {
  const groups: { label: string; entries: HistoryEntry[] }[] = [];

  entries.forEach((entry) => {
    const label = getGroupLabel(entry.createdAt);
    const existingGroup = groups.find((g) => g.label === label);
    if (existingGroup) {
      existingGroup.entries.push(entry);
    } else {
      groups.push({ label, entries: [entry] });
    }
  });

  return groups;
};

const TaskHistoryDrawer = ({
  isOpen,
  onClose,
  taskId,
}: TaskHistoryDrawerProps) => {
  const { data: taskHistory, isLoading } = useGetTaskHistory(taskId);
  const { user } = useAppStore();
  const groupedHistory = taskHistory ? groupHistoryByDate(taskHistory) : [];

  return (
    <>
      <div
        className={`history-drawer-overlay ${
          isOpen ? "history-drawer-overlay-open" : ""
        }`}
        onClick={onClose}
      />

      <div
        className={`history-drawer ${isOpen ? "history-drawer-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-drawer-title"
      >
        <div className="history-drawer-header">
          <div className="history-drawer-title-group">
            <History size={18} aria-hidden="true" />
            <h2 id="history-drawer-title" className="history-drawer-title">
              Task History
            </h2>
            {taskHistory && taskHistory.length > 0 && (
              <span className="history-drawer-count">{taskHistory.length}</span>
            )}
          </div>
          <button
            type="button"
            className="history-drawer-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="history-drawer-body">
          {isLoading && (
            <div className="history-drawer-loading">
              <Clock size={22} className="spin" />
              <p>Loading timeline...</p>
            </div>
          )}

          {!isLoading && (!taskHistory || taskHistory.length === 0) && (
            <div className="history-drawer-empty">
              <History size={26} />
              <p>No activity recorded yet.</p>
            </div>
          )}

          {!isLoading &&
            groupedHistory.map((group) => (
              <div className="history-group" key={group.label}>
                <div className="history-group-label">
                  <Calendar size={11} aria-hidden="true" />
                  <span>{group.label}</span>
                </div>

                <ul className="history-list">
                  {group.entries.map((entry: HistoryEntry) => (
                    <li key={entry.id} className="history-item">
                      <div className="history-item-icon-col">
                        {getEventIcon(entry.eventType, entry.fieldChanged)}
                        <span className="history-item-connector" />
                      </div>
                      <div className="history-item-content">
                        <div className="history-item-text">
                          {formatEventDescription(entry, user?.id)}
                        </div>
                        <span
                          className="history-item-time"
                          title={formatFullTimestamp(entry.createdAt)}
                        >
                          {formatTime(entry.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default TaskHistoryDrawer;
