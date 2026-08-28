import { Transaction } from "sequelize";
import { TaskHistory } from "../models";
import { TaskHistoryRepository } from "../repositories/taskHistoryRepository";
import { TaskRepository } from "../repositories/taskReposiotry";

function toComparable(value: any): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatDate(value);
  }
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

interface TaskBody {
  name?: string;
  description?: string | null;
  priority?: string;
  estimatedTime?: number | null;
  dueDate?: Date | string | null;
  statusId?: string;
  statusName?: string;
}

interface TimeEntryBody {
  durationMinutes?: number;
  entryDate?: Date | string | null;
  note?: string | null;
}
export class TaskHistoryService {
  static async recordTaskCreated(
    taskId: string,
    actorId: string,
    transaction: Transaction,
  ): Promise<TaskHistory> {
    return TaskHistoryRepository.logTaskHistory(
      {
        taskId,
        actorId,
        eventType: "TASK_CREATED",
      },
      transaction,
    );
  }

  static async recordTaskUpdated(
    taskId: string,
    actorId: string,
    before: TaskBody,
    after: TaskBody,
    transaction: Transaction,
    assignedAssigneesBefore?: string[],
    assignedAssigneesAfter?: string[],
  ): Promise<TaskHistory[]> {
    const promises: Promise<TaskHistory>[] = [];
    for (const field of [
      "name",
      "description",
      "priority",
      "estimatedTime",
      "dueDate",
    ]) {
      const oldValue = toComparable(before[field as keyof TaskBody]);
      const newValue = toComparable(after[field as keyof TaskBody]);
      if (oldValue !== newValue) {
        promises.push(
          TaskHistoryRepository.logTaskHistory(
            {
              taskId,
              actorId,
              eventType: "FIELD_UPDATED",
              fieldChanged: field,
              oldValue,
              newValue,
            },
            transaction,
          ),
        );
      }
    }
    if (toComparable(before.statusId) !== toComparable(after.statusId)) {
      promises.push(
        TaskHistoryRepository.logTaskHistory(
          {
            taskId,
            actorId,
            eventType: "STATUS_CHANGED",
            fieldChanged: "status",
            oldValue: before?.statusName,
            newValue: after?.statusName,
          },
          transaction,
        ),
      );
    }
    if (
      assignedAssigneesBefore !== undefined ||
      assignedAssigneesAfter !== undefined
    ) {
      const beforeList = (assignedAssigneesBefore ?? []).filter(Boolean);
      const afterList = (assignedAssigneesAfter ?? []).filter(Boolean);

      const isChanged =
        beforeList.length !== afterList.length ||
        !beforeList.every((id) => afterList.includes(id));

      if (isChanged) {
        const sortedBefore = [...beforeList].sort();
        const sortedAfter = [...afterList].sort();

        promises.push(
          TaskHistoryRepository.logTaskHistory(
            {
              taskId,
              actorId,
              eventType: "ASSIGNEES_CHANGED",
              fieldChanged: "assignees",
              oldValue:
                sortedBefore.length > 0 ? sortedBefore.join(", ") : null,
              newValue: sortedAfter.length > 0 ? sortedAfter.join(", ") : null,
            },
            transaction,
          ),
        );
      }
    }
    return Promise.all(promises);
  }

  static async recordTimeEntryCreated(
    taskId: string,
    actorId: string,
    entry: TimeEntryBody,
    transaction?: Transaction,
  ) {
    const mins = entry.durationMinutes ? `${entry.durationMinutes} mins` : "";
    return TaskHistoryRepository.logTaskHistory(
      {
        taskId,
        actorId,
        eventType: "TIME_ENTRY_CREATED",
        newValue: mins,
      },
      transaction,
    );
  }

  static async recordTimeEntryUpdated(
    taskId: string,
    actorId: string,
    before: TimeEntryBody,
    after: TimeEntryBody,
    transaction?: Transaction,
  ): Promise<TaskHistory[]> {
    const promises: Promise<TaskHistory>[] = [];

    if (toComparable(before.note) !== toComparable(after.note)) {
      promises.push(
        TaskHistoryRepository.logTaskHistory(
          {
            taskId,
            actorId,
            fieldChanged: "note",
            eventType: "TIME_ENTRY_UPDATED",
            oldValue: before.note ?? null,
            newValue: after.note ?? null,
          },
          transaction,
        ),
      );
    }

    if (toComparable(before.entryDate) !== toComparable(after.entryDate)) {
      promises.push(
        TaskHistoryRepository.logTaskHistory(
          {
            taskId,
            actorId,
            fieldChanged: "entryDate",
            eventType: "TIME_ENTRY_UPDATED",
            oldValue: formatDate(before.entryDate),
            newValue: formatDate(after.entryDate),
          },
          transaction,
        ),
      );
    }

    if (
      toComparable(before.durationMinutes) !==
      toComparable(after.durationMinutes)
    ) {
      promises.push(
        TaskHistoryRepository.logTaskHistory(
          {
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
          },
          transaction,
        ),
      );
    }

    return Promise.all(promises);
  }

  static async recordTimeEntryDeleted(
    taskId: string,
    actorId: string,
    entry: TimeEntryBody,
    transaction?: Transaction,
  ) {
    return TaskHistoryRepository.logTaskHistory(
      {
        taskId,
        actorId,
        eventType: "TIME_ENTRY_DELETED",
        oldValue: entry.durationMinutes
          ? `${entry.durationMinutes} mins`
          : null,
      },
      transaction,
    );
  }

  static async getTaskHistory(taskId: string, userId: string) {
    const taskOwned = await TaskRepository.findOwnedTask(taskId, userId);
    if (!taskOwned) {
      throw {
        status: 404,
        message: "Task not found or you do not have permission to access it",
      };
    }
    const taskHistory = await TaskHistoryRepository.fetchTaskHistory(taskId);
    return taskHistory;
  }
}
