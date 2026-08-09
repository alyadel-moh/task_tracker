import {
  X,
  History,
  Plus,
  Clock,
  ArrowRightLeft,
  Trash2,
  FileText,
} from "lucide-react";
import "../css/TaskHistoryDrawer.css";
import useGetTaskHistory from "../hooks/getTaskHistoryHook";

interface TaskHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
}

export interface HistoryEntry {
  id: string;
  eventType: string;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  };
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
};

const formatValue = (val?: string | null) => {
  if (!val) return "";

  const mappings: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    IN_REVIEW: "In Review",
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

const getEventIcon = (eventType: string) => {
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

const formatEventDescription = (entry: HistoryEntry) => {
  const actorName = entry.actor?.name || "A user";
  const fieldName = entry.fieldChanged
    ? FIELD_LABEL_MAP[entry.fieldChanged] || entry.fieldChanged
    : "";

  const oldVal = formatValue(entry.oldValue);
  const newVal = formatValue(entry.newValue);

  // 1. Task Created
  if (entry.eventType === "TASK_CREATED") {
    return (
      <>
        <span className="history-item-actor">{actorName}</span> created this
        task
      </>
    );
  }

  // 2. Time Entry Created
  if (entry.eventType === "TIME_ENTRY_CREATED") {
    return (
      <>
        <span className="history-item-actor">{actorName}</span> logged a time
        entry {newVal && <span className="history-highlight">({newVal})</span>}
      </>
    );
  }

  // 3. Time Entry Updated
  if (
    entry.eventType === "TIME_ENTRY_UPDATED" ||
    entry.eventType === "TIME_ENTRY_ENTRY_UPDATED"
  ) {
    if (fieldName && oldVal && newVal) {
      return (
        <>
          <span className="history-item-actor">{actorName}</span> updated time
          entry <span className="history-field-name">{fieldName}</span> from{" "}
          <span className="history-value-badge">{oldVal}</span> to{" "}
          <span className="history-value-badge">{newVal}</span>
        </>
      );
    }
    if (fieldName && newVal) {
      return (
        <>
          <span className="history-item-actor">{actorName}</span> updated time
          entry <span className="history-field-name">{fieldName}</span> to{" "}
          <span className="history-value-badge">{newVal}</span>
        </>
      );
    }
    return (
      <>
        <span className="history-item-actor">{actorName}</span> updated a time
        entry
      </>
    );
  }

  // 4. Time Entry Deleted
  if (entry.eventType === "TIME_ENTRY_DELETED") {
    return (
      <>
        <span className="history-item-actor">{actorName}</span> deleted a time
        entry
      </>
    );
  }

  // 5. Status Changed
  if (entry.eventType === "STATUS_CHANGED" || fieldName === "Status") {
    return (
      <>
        <span className="history-item-actor">{actorName}</span> changed{" "}
        <span className="history-field-name">Status</span> from{" "}
        <span className="history-value-badge">{oldVal || "None"}</span> to{" "}
        <span className="history-value-badge">{newVal}</span>
      </>
    );
  }

  // 6. Task Attributes (Name, Description, Due Date, Priority, etc.)
  if (fieldName) {
    if (oldVal && newVal) {
      return (
        <>
          <span className="history-item-actor">{actorName}</span> updated{" "}
          <span className="history-field-name">{fieldName}</span> from{" "}
          <span className="history-value-badge">{oldVal}</span> to{" "}
          <span className="history-value-badge">{newVal}</span>
        </>
      );
    }
    if (newVal) {
      return (
        <>
          <span className="history-item-actor">{actorName}</span> updated{" "}
          <span className="history-field-name">{fieldName}</span> to{" "}
          <span className="history-value-badge">{newVal}</span>
        </>
      );
    }
    return (
      <>
        <span className="history-item-actor">{actorName}</span> cleared{" "}
        <span className="history-field-name">{fieldName}</span>
      </>
    );
  }

  return (
    <>
      <span className="history-item-actor">{actorName}</span> updated the task
    </>
  );
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const TaskHistoryDrawer = ({
  isOpen,
  onClose,
  taskId,
}: TaskHistoryDrawerProps) => {
  const { data: taskHistory, isLoading } = useGetTaskHistory(taskId);

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

          {!isLoading && taskHistory && taskHistory.length > 0 && (
            <ul className="history-list">
              {taskHistory.map((entry: HistoryEntry) => (
                <li key={entry.id} className="history-item">
                  {getEventIcon(entry.eventType)}
                  <div className="history-item-content">
                    <p className="history-item-text">
                      {formatEventDescription(entry)}
                    </p>
                    <span className="history-item-time">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default TaskHistoryDrawer;
