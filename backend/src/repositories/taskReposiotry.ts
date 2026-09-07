import { Includeable, Op, Sequelize, Transaction } from "sequelize";
import sequelize, {
  Task,
  Status,
  ProjectMembers,
  User,
  TaskAssignee,
} from "../models";
import { TaskPriority } from "../models/task";
export class TaskRepository {
  static async create(
    projectId: string,
    name: string,
    description: string | null,
    statusId: string | null,
    estimatedTime: number | null,
    dueDate: Date | null,
    priority: TaskPriority,
    userId: string,
    assignees: string[] = [],
    transaction?: Transaction,
  ) {
    const newTask = await Task.create(
      {
        name,
        description,
        estimatedTime,
        dueDate,
        priority,
        projectId,
        statusId,
        createdBy: userId,
      },
      { transaction },
    );

    const uniqueAssigneeIds = [...new Set(assignees.filter(Boolean))];
    if (uniqueAssigneeIds.length > 0) {
      const assigneeRecords = uniqueAssigneeIds.map((assigneeId) => ({
        taskId: newTask.id,
        projectId: newTask.projectId,
        userId: assigneeId,
      }));
      await TaskAssignee.bulkCreate(assigneeRecords, {
        transaction,
        ignoreDuplicates: true,
      });
    }

    return newTask;
  }
  static async getByIdwithStatus(id: string, projectId: string) {
    return await Task.findOne({
      where: { id, projectId },
      include: [
        {
          model: Status,
          as: "status",
          attributes: ["name"],
        },
        {
          model: User,
          as: "assignees",
          attributes: ["id", "name", "email", "photoUrl"],
          through: { attributes: [] },
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "photoUrl"],
        },
      ],
      attributes: [
        "id",
        "name",
        "description",
        "statusId",
        "priority",
        "estimatedTime",
        "dueDate",
        "createdBy",
        "createdAt",
        "updatedAt",
      ],
    });
  }
  static async getById(id: string, projectId: string) {
    const task = await Task.findOne({
      where: { id, projectId },
      attributes: [
        "id",
        "projectId",
        "name",
        "description",
        "statusId",
        "priority",
        "estimatedTime",
        "dueDate",
      ],
    });
    return task;
  }

  static async getAll(
    projectId: string,
    search: string,
    statusId: string | string[],
    priority: string | string[],
    overdue: boolean | string,
    assigneeId: string,
    createdById: string,
  ) {
    const whereConditions: any[] = [{ projectId }];

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereConditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: searchTerm } },
          { description: { [Op.iLike]: searchTerm } },
        ],
      });
    }

    if (priority) {
      const priorityList = Array.isArray(priority) ? priority : [priority];
      if (priorityList.length > 0) {
        whereConditions.push({ priority: { [Op.in]: priorityList } });
      }
    }
    const statusConditions: any[] = [];

    if (statusId) {
      const statusList = Array.isArray(statusId) ? statusId : [statusId];
      if (statusList.length > 0) {
        statusConditions.push({
          [Op.or]: [{ id: { [Op.in]: statusList } }],
        });
      }
    }

    const isOverdue = overdue === true || overdue === "true";

    if (isOverdue) {
      whereConditions.push({
        dueDate: {
          [Op.and]: [{ [Op.ne]: null }, { [Op.lt]: Sequelize.fn("NOW") }],
        },
      });

      statusConditions.push({
        name: { [Op.not]: "DONE" },
      });
    }
    const hasStatusFilters = statusConditions.length > 0;
    const includeOptions: Includeable[] = [
      {
        model: Status,
        as: "status",
        where: hasStatusFilters ? { [Op.and]: statusConditions } : undefined,
        required: hasStatusFilters,
      },
    ];
    const rawMemberId = assigneeId || createdById;
    const memberId =
      rawMemberId &&
      rawMemberId !== "null" &&
      rawMemberId !== "undefined" &&
      rawMemberId.trim() !== ""
        ? rawMemberId.trim()
        : null;

    if (memberId) {
      whereConditions.push({
        [Op.or]: [
          { createdBy: memberId },
          Sequelize.literal(`EXISTS (
            SELECT 1 FROM "task_assignees" AS "ta"
            WHERE "ta"."task_id" = "Task"."id"
            AND "ta"."user_id" = ${sequelize.escape(memberId)}
          )`),
        ],
      });
    }
    return await Task.findAll({
      where: { [Op.and]: whereConditions },
      include: includeOptions,
      order: [["createdAt", "DESC"]],
      attributes: [
        "id",
        "name",
        "description",
        "statusId",
        "priority",
        "estimatedTime",
        "dueDate",
        "createdAt",
        "projectId",
        "createdBy",
      ],
    });
  }

  static async removeAssignedUserFromTask(
    projectId: string,
    userId: string,
    transaction?: Transaction,
  ) {
    return await TaskAssignee.destroy({
      where: { projectId, userId },
      transaction,
    });
  }
  static async getTasksAssignedWithStatusId(
    projectId: string,
    statusId: string,
    transaction?: Transaction,
  ) {
    return Task.findAll({
      where: { projectId, statusId },
      transaction,
      attributes: ["id"],
      raw: true,
    });
  }
  static async getTaskWithAccess(taskId: string, userId: string) {
    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: ProjectMembers,
          as: "projectMembers",
          required: false,
          where: {
            userId,
            membershipStatus: "ACTIVE",
          },
          attributes: ["id", "role"],
        },
        {
          model: TaskAssignee,
          as: "taskAssignments",
          required: false,
          where: { userId },
          attributes: ["userId"],
        },
      ],
      attributes: ["id", "createdBy", "projectId", "estimatedTime"],
    });

    if (!task) return null;

    const projectMembers: any[] = (task as any).projectMembers || [];
    const isProjectMember = Boolean((task as any).projectMembers?.length > 0);
    const isCreator = task.createdBy === userId;
    const isAssignee = Boolean((task as any).taskAssignments?.length > 0);
    const isProjectOwner = projectMembers.some(
      (pm: any) => pm.role === "OWNER",
    );
    const isTaskMember = isCreator || isAssignee;
    const isAuthorized = isProjectOwner || isTaskMember;
    return {
      task,
      isProjectMember,
      isTaskMember,
      isProjectOwner,
      isAuthorized,
    };
  }
  static async updateAssignees(
    taskId: string,
    projectId: string,
    assigneeIds: string[],
    currentAssigneeIds: string[],
    transaction?: Transaction,
  ) {
    const targetUserIdSet = new Set(assigneeIds);
    const currentUserIdSet = new Set(currentAssigneeIds);

    const userIdsToAdd = Array.from(targetUserIdSet).filter(
      (id) => !currentUserIdSet.has(id),
    );

    const userIdsToRemove = Array.from(currentUserIdSet).filter(
      (id) => !targetUserIdSet.has(id),
    );

    if (userIdsToRemove.length > 0) {
      await TaskAssignee.destroy({
        where: {
          taskId,
          projectId,
          userId: { [Op.in]: userIdsToRemove },
        },
        transaction,
      });
    }

    if (userIdsToAdd.length > 0) {
      await TaskAssignee.bulkCreate(
        userIdsToAdd.map((userId) => ({
          taskId,
          projectId,
          userId,
        })),
        { transaction },
      );
    }
    const updatedAssignees = await TaskAssignee.findAll({
      where: { taskId, projectId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "photoUrl"],
        },
      ],
      transaction,
    });

    return updatedAssignees.map((record: any) => record.user).filter(Boolean);
  }
  static async getTaskWithAssigneesAndAccess(
    taskId: string,
    projectId: string,
    userId: string,
  ) {
    const task = await Task.findOne({
      where: { id: taskId, projectId },
      include: [
        {
          model: User,
          as: "assignees",
          attributes: ["id", "name", "email"],
          through: { attributes: [] },
        },
        {
          model: ProjectMembers,
          as: "projectMembers",
          required: false,
          where: {
            userId,
            membershipStatus: "ACTIVE",
          },
          attributes: ["id", "role"],
        },
      ],
      attributes: [
        "id",
        "name",
        "description",
        "statusId",
        "priority",
        "estimatedTime",
        "dueDate",
        "createdBy",
        "projectId",
      ],
    });
    if (!task) return null;
    const assignees = (task as any).assignees || [];
    const projectMembers: any[] = (task as any).projectMembers || [];
    const isProjectMember = Boolean((task as any).projectMembers?.length > 0);
    const isCreator = task.createdBy === userId;
    const isProjectOwner = projectMembers.some(
      (pm: any) => pm.role === "OWNER",
    );
    const isAssignee = assignees.some((a: any) => a.id === userId);
    const isTaskMember = isCreator || isAssignee;
    const isAuthorized = isProjectOwner || isTaskMember;
    return {
      task,
      isProjectMember,
      isTaskMember,
      isProjectOwner,
      isAuthorized,
    };
  }
}
