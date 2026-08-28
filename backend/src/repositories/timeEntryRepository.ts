import { Transaction } from "sequelize";
import { TimeEntry } from "../models";

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
    entryDate: Date,
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
}
