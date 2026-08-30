import { TaskHistoryService } from "./taskHistoryService";
import { isValidISODate, isNumberInRange } from "../utils/validators";
import { TaskRepository } from "../repositories/taskReposiotry";
import { TimeEntryRepository } from "../repositories/timeEntryRepository";
import { TaskHistoryRepository } from "../repositories/taskHistoryRepository";
import sequelize, { Task, TimeEntry } from "../models";

interface UpdateTimeEntryBody {
  durationMinutes?: number;
  entryDate?: Date | string;
  note?: string;
}
function assertTaskAuthorization(access: any): asserts access is {
  task: Task;
  isProjectMember: boolean;
  isTaskMember: boolean;
  isProjectOwner: boolean;
  isAuthorized: boolean;
} {
  if (!access || !access.task) {
    throw { status: 404, message: "Task not found" };
  }

  if (!access.isProjectMember) {
    throw { status: 403, message: "You are not a member of this project" };
  }
  if (!access.isAuthorized) {
    const reasons: string[] = [];
    if (!access.isProjectOwner) {
      reasons.push("not the project owner");
    }
    if (!access.isTaskMember) {
      reasons.push("neither assigned to nor the creator of this task");
    }
    throw {
      status: 403,
      message: `Access denied: you are ${reasons.join(" and ")}.`,
    };
  }
}

async function getTaskWithAccess(userId: string, taskId: string) {
  const access = await TaskRepository.getTaskWithAccess(taskId, userId);
  assertTaskAuthorization(access);
  return access.task;
}

export class TimeEntryService {
  static async create(
    durationMinutes: number,
    entryDate: Date | string,
    note: string,
    taskId: string,
    userId: string,
  ) {
    const task = await getTaskWithAccess(userId, taskId);
    if (
      !Number.isInteger(durationMinutes) ||
      !isNumberInRange(durationMinutes, 1, 1440)
    ) {
      throw {
        status: 400,
        message: "Duration must be an integer between 1 and 1440 minutes",
      };
    }
    if (!entryDate || !isValidISODate(entryDate)) {
      throw { status: 400, message: "Entry date is required" };
    }
    const transaction = await sequelize.transaction();
    try {
      const timeEntry = await TimeEntryRepository.create(
        durationMinutes,
        entryDate,
        note,
        taskId,
        transaction,
      );

      const historyEntry = await TaskHistoryService.recordTimeEntryCreated(
        taskId,
        userId,
        {
          durationMinutes,
          entryDate: new Date(entryDate),
          note: note || undefined,
        },
        transaction,
      );
      const taskHistoryEntry =
        await TaskHistoryRepository.fetchHistoryWithActor(
          historyEntry.id,
          transaction,
        );
      const totalMinutes = await TimeEntryRepository.sumloggedTime(
        taskId,
        transaction,
      );
      const overrun = task.estimatedTime
        ? totalMinutes > task.estimatedTime
        : false;
      await transaction.commit();
      return { timeEntry, taskHistoryEntry, overrun };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getAll(taskId: string, userId: string) {
    const access = await TaskRepository.getTaskWithAccess(taskId, userId);
    if (!access || !access.task) {
      throw { status: 404, message: "Task not found" };
    }
    if (!access?.isProjectMember) {
      throw { status: 403, message: "You are not a member of this project" };
    }
    const timeEntries = await TimeEntryRepository.getAll(taskId);
    const totalMinutes = await TimeEntryRepository.sumloggedTime(taskId);
    return { timeEntries, totalMinutes };
  }

  static async update(
    durationMinutes: number,
    entryDate: Date | string,
    note: string,
    taskId: string,
    userId: string,
    id: string,
  ) {
    const access = await TimeEntryRepository.getTimeEntrywithAccess(
      id,
      taskId,
      userId,
    );
    assertTaskAuthorization(access);
    const timeEntry = access?.timeEntry;
    if (!timeEntry) {
      throw { status: 404, message: "Time entry not found" };
    }
    const before = {
      durationMinutes: timeEntry.durationMinutes,
      entryDate: timeEntry.entryDate,
      note: timeEntry.note,
    };
    if (durationMinutes !== undefined) {
      if (
        !isNumberInRange(durationMinutes, 1, 1440) ||
        !Number.isInteger(durationMinutes)
      ) {
        throw {
          status: 400,
          message: "durationMinutes must be between 1 and 1440 minutes",
        };
      }
    }
    if (entryDate !== undefined && (!entryDate || !isValidISODate(entryDate))) {
      throw { status: 400, message: "Entry date cannot be empty" };
    }
    const updatedFields: Partial<UpdateTimeEntryBody> = {};
    const changedLabels: string[] = [];

    if (
      durationMinutes !== undefined &&
      durationMinutes !== timeEntry.durationMinutes
    ) {
      timeEntry.durationMinutes = durationMinutes;
      updatedFields.durationMinutes = durationMinutes;
      changedLabels.push("Duration");
    }
    if (entryDate !== undefined) {
      const newTimestamp = new Date(entryDate).getTime();
      const oldTimestamp = new Date(timeEntry.entryDate).getTime();
      if (newTimestamp !== oldTimestamp) {
        timeEntry.entryDate = new Date(entryDate);
        updatedFields.entryDate = entryDate;
        changedLabels.push("Entry date");
      }
    }
    if (note !== undefined && note !== timeEntry.note) {
      timeEntry.note = note;
      updatedFields.note = note;
      changedLabels.push("Note");
    }
    if (changedLabels.length === 0) {
      return {
        updatedFields: {},
        detailedHistoryEntries: [],
        changedLabels: [],
        overrun: false,
      };
    }
    const transaction = await sequelize.transaction();
    try {
      await timeEntry.save({ transaction });
      const historyEntries = await TaskHistoryService.recordTimeEntryUpdated(
        taskId,
        userId,
        before,
        {
          durationMinutes:
            updatedFields.durationMinutes ?? timeEntry.durationMinutes,
          entryDate: updatedFields.entryDate
            ? new Date(updatedFields.entryDate)
            : timeEntry.entryDate,
          note: updatedFields.note ?? timeEntry.note,
        },
        transaction,
      );
      const detailedHistoryEntries = await Promise.all(
        (historyEntries || []).map((entry) =>
          TaskHistoryRepository.fetchHistoryWithActor(entry.id, transaction),
        ),
      );
      const totalMinutes = await TimeEntryRepository.sumloggedTime(
        taskId,
        transaction,
      );
      const overrun =
        changedLabels.includes("Duration") && access.task.estimatedTime
          ? totalMinutes > access.task.estimatedTime
          : false;
      await transaction.commit();
      return {
        updatedFields,
        detailedHistoryEntries,
        changedLabels,
        overrun,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  static async remove(taskId: string, userId: string, id: string) {
    const access = await TimeEntryRepository.getTimeEntrywithAccess(
      id,
      taskId,
      userId,
    );
    assertTaskAuthorization(access);
    const timeEntry = access?.timeEntry;
    if (!timeEntry) {
      throw { status: 404, message: "Time entry not found" };
    }
    const transaction = await sequelize.transaction();
    try {
      const historyEntry = await TaskHistoryService.recordTimeEntryDeleted(
        taskId,
        userId,
        {
          durationMinutes: timeEntry.durationMinutes,
          entryDate: timeEntry.entryDate
            ? new Date(timeEntry.entryDate)
            : undefined,
          note: timeEntry.note,
        },
        transaction,
      );
      const taskHistoryEntry =
        await TaskHistoryRepository.fetchHistoryWithActor(
          historyEntry.id,
          transaction,
        );
      await timeEntry.destroy({ transaction });
      await transaction.commit();
      return taskHistoryEntry;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
