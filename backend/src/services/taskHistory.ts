import { TaskHistory } from "../models";

function toComparable(value: any): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return String(value);
}

function formatDate(date: any): string {
  if (!date) return "";
  if (date instanceof Date) return date.toISOString().split("T")[0];
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return String(date).split("T")[0];
}

interface CreateTaskHistoryInput {
  taskId: string;
  actorId: string;
  eventType: string;
  fieldChanged?: string | null;
  oldValue?: any;
  newValue?: any;
}

interface TaskBody {
  title?: string;
  description?: string | null;
  priority?: string;
  estimatedMinutes?: number | null;
  dueDate?: Date | string | null;
  statusId?: string;
  statusName?: string;
}

interface TimeEntryBody {
  durationMinutes?: number;
  entryDate?: Date | string | null;
  note?: string | null;
}

async function logTaskHistory(
  taskhistory: CreateTaskHistoryInput,
): Promise<TaskHistory> {
  return TaskHistory.create({
    taskId: taskhistory.taskId,
    actorId: taskhistory.actorId,
    eventType: taskhistory.eventType,
    fieldChanged: taskhistory.fieldChanged,
    oldValue: toComparable(taskhistory.oldValue),
    newValue: toComparable(taskhistory.newValue),
  });
}

export async function recordTaskCreated(
  taskId: string,
  actorId: string,
): Promise<TaskHistory> {
  return logTaskHistory({
    taskId,
    actorId,
    eventType: "TASK_CREATED",
  });
}

export async function recordTaskUpdated(
  taskId: string,
  actorId: string,
  before: TaskBody,
  after: TaskBody,
): Promise<TaskHistory[] | undefined> {
  const historyEntries: TaskHistory[] = [];
  for (const field of [
    "name",
    "description",
    "priority",
    "estimatedTime",
    "dueDate",
  ]) {
    const oldval = before[field as keyof TaskBody];
    const newval = after[field as keyof TaskBody];

    if (toComparable(oldval) !== toComparable(newval)) {
      historyEntries.push(
        await logTaskHistory({
          taskId,
          actorId,
          eventType: "FIELD_UPDATED",
          fieldChanged: field,
          oldValue: oldval instanceof Date ? formatDate(oldval) : oldval,
          newValue: newval instanceof Date ? formatDate(newval) : newval,
        }),
      );
    }
  }
  if (toComparable(before.statusId) !== toComparable(after.statusId)) {
    historyEntries.push(
      await logTaskHistory({
        taskId,
        actorId,
        eventType: "STATUS_CHANGED",
        fieldChanged: "status",
        oldValue: before?.statusName,
        newValue: after?.statusName,
      }),
    );
  }
  return historyEntries;
}

export async function recordTimeEntryCreated(
  taskId: string,
  actorId: string,
  entry: TimeEntryBody,
) {
  const mins = entry.durationMinutes ? `${entry.durationMinutes} mins` : "";
  return logTaskHistory({
    taskId,
    actorId,
    eventType: "TIME_ENTRY_CREATED",
    newValue: mins,
  });
}

export async function recordTimeEntryUpdated(
  taskId: string,
  actorId: string,
  before: TimeEntryBody,
  after: TimeEntryBody,
): Promise<TaskHistory[] | undefined> {
  const historyEntries: TaskHistory[] = [];
  if (toComparable(before.note) !== toComparable(after.note)) {
    historyEntries.push(
      await logTaskHistory({
        taskId,
        actorId,
        fieldChanged: "note",
        eventType: "TIME_ENTRY_UPDATED",
        oldValue: before.note,
        newValue: after.note,
      }),
    );
  }
  if (toComparable(before.entryDate) !== toComparable(after.entryDate)) {
    historyEntries.push(
      await logTaskHistory({
        taskId,
        actorId,
        fieldChanged: "entryDate",
        eventType: "TIME_ENTRY_UPDATED",
        oldValue: formatDate(before.entryDate),
        newValue: formatDate(after.entryDate),
      }),
    );
  }
  if (
    toComparable(before.durationMinutes) !== toComparable(after.durationMinutes)
  ) {
    historyEntries.push(
      await logTaskHistory({
        taskId,
        actorId,
        fieldChanged: "durationMinutes",
        eventType: "TIME_ENTRY_UPDATED",
        oldValue: before.durationMinutes
          ? `${before.durationMinutes} mins`
          : null,
        newValue: after.durationMinutes
          ? `${after.durationMinutes} mins`
          : null,
      }),
    );
  }
  return historyEntries;
}

export async function recordTimeEntryDeleted(
  taskId: string,
  actorId: string,
  entry: TimeEntryBody,
) {
  return logTaskHistory({
    taskId,
    actorId,
    eventType: "TIME_ENTRY_DELETED",
    oldValue: entry.durationMinutes ? `${entry.durationMinutes} mins` : null,
  });
}
