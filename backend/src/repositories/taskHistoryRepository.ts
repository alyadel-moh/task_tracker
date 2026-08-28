import { Transaction } from "sequelize";
import { TaskHistory, User } from "../models";
interface CreateTaskHistoryInput {
  taskId: string;
  actorId: string;
  eventType: string;
  fieldChanged?: string | null;
  oldValue?: any;
  newValue?: any;
}
export class TaskHistoryRepository {
  static async fetchHistoryWithActor(
    historyId?: string,
    transaction?: Transaction,
  ) {
    if (!historyId) return null;
    return TaskHistory.findOne({
      where: { id: historyId },
      transaction,
      attributes: [
        "id",
        "taskId",
        "actorId",
        "eventType",
        "fieldChanged",
        "oldValue",
        "newValue",
        "createdAt",
      ],
      include: [
        { model: User, as: "actor", attributes: ["id", "name", "email"] },
      ],
    });
  }
  static async fetchTaskHistory(taskId: string) {
    return TaskHistory.findAll({
      where: { taskId },
      include: [
        {
          model: User,
          as: "actor",
          attributes: ["id", "name", "email"],
        },
      ],
      attributes: [
        "id",
        "eventType",
        "fieldChanged",
        "oldValue",
        "newValue",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });
  }
  static async logTaskHistory(
    taskhistory: CreateTaskHistoryInput,
    transaction?: Transaction,
  ): Promise<TaskHistory> {
    return TaskHistory.create(
      {
        taskId: taskhistory.taskId,
        actorId: taskhistory.actorId,
        eventType: taskhistory.eventType,
        fieldChanged: taskhistory.fieldChanged,
        oldValue: taskhistory.oldValue,
        newValue: taskhistory.newValue,
      },
      { transaction },
    );
  }
}
