import { Transaction } from "sequelize";
import { ProjectMembers, Task, TaskAssignee, TimeEntry } from "../models";

export class TimeEntryRepository {
  static async sumloggedTime(
    taskId: string,
    transaction?: Transaction,
  ): Promise<number> {
    const total = await TimeEntry.sum("durationMinutes", {
      where: { taskId },
      transaction,
    });
    return Number.isNaN(total) || total === null ? 0 : Number(total);
  }

  static async create(
    durationMinutes: number,
    entryDate: Date | string,
    note: string,
    taskId: string,
    transaction: Transaction,
  ) {
    return await TimeEntry.create(
      {
        taskId,
        durationMinutes,
        entryDate: new Date(entryDate),
        note: note || null,
      },
      { transaction },
    );
  }

  static async getAll(taskId: string) {
    return await TimeEntry.findAll({
      where: { taskId },
      attributes: [
        "id",
        "durationMinutes",
        "entryDate",
        "note",
        "createdAt",
        "updatedAt",
      ],
      order: [
        ["entryDate", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
  }
  static async getById(id: string, taskId: string) {
    return await TimeEntry.findOne({
      where: { id, taskId },
      attributes: ["id", "durationMinutes", "entryDate", "note"],
    });
  }
  static async getTimeEntrywithAccess(
    id: string,
    taskId: string,
    userId: string,
  ) {
    const timeEntry = await TimeEntry.findOne({
      where: { id, taskId },
      include: [
        {
          model: Task,
          as: "task",
          attributes: ["id", "createdBy", "estimatedTime"],
          include: [
            {
              model: TaskAssignee,
              as: "taskAssignments",
              required: false,
              where: { userId },
              attributes: ["userId"],
            },
            {
              model: ProjectMembers,
              as: "projectMembers",
              required: false,
              where: { userId, membershipStatus: "ACTIVE" },
              attributes: ["id", "role"],
            },
          ],
        },
      ],
      attributes: ["id", "durationMinutes", "entryDate", "note"],
    });

    if (!timeEntry) return null;

    const task = (timeEntry as any).task;
    if (!task) {
      return {
        timeEntry,
        task: null,
        isProjectMember: false,
        isTaskMember: false,
        isProjectOwner: false,
        isAuthorized: false,
      };
    }

    const projectMembers: any[] = task.projectMembers || [];
    const isProjectMember = projectMembers.length > 0;
    const isCreator = task.createdBy === userId;
    const isAssignee = Boolean(task.taskAssignments?.length > 0);
    const isProjectOwner = projectMembers.some(
      (pm: any) => pm.role === "OWNER",
    );
    const isTaskMember = isCreator || isAssignee;
    const isAuthorized = isProjectOwner || isTaskMember;

    return {
      timeEntry,
      task,
      isProjectMember,
      isTaskMember,
      isProjectOwner,
      isAuthorized,
    };
  }
}
