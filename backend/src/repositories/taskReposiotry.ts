import { Includeable, Op, Transaction, WhereOptions } from "sequelize";
import { Task, Status, ProjectMembers, User } from "../models";
import { TaskPriority } from "../models/task";
import { TaskAssignee } from "../models/taskAssignee";
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
  ) {
    const whereClause: WhereOptions & Record<PropertyKey, any> = { projectId };

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or as unknown as string] = [
        { name: { [Op.iLike]: searchTerm } },
        { description: { [Op.iLike]: searchTerm } },
      ];
    }

    if (priority) {
      const priorityList = Array.isArray(priority) ? priority : [priority];
      if (priorityList.length > 0) {
        whereClause.priority = { [Op.in]: priorityList };
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

    if (overdue === "true" || overdue === true) {
      whereClause.dueDate = {
        [Op.and]: [{ [Op.ne]: null }, { [Op.lt]: new Date() }],
      };
      statusConditions.push({ name: { [Op.ne]: "DONE" } });
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

    if (assigneeId) {
      includeOptions.push({
        model: TaskAssignee,
        as: "taskAssignments",
        where: { userId: assigneeId, projectId: projectId },
        attributes: [],
        required: true,
      });
    }
    return await Task.findAll({
      where: whereClause,
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
  static async getTasksassignedwithStatusId(
    projectId: string,
    statusId: string,
    transaction?: Transaction,
  ) {
    return Task.findAll({
      where: { projectId, statusId },
      transaction,
      attributes: ["id"],
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
          attributes: ["id"],
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

    const isProjectMember = Boolean((task as any).projectMembers?.length > 0);
    const isCreator = task.createdBy === userId;
    const isAssignee = Boolean((task as any).taskAssignments?.length > 0);
    const isTaskMember = isCreator || isAssignee;

    return {
      task,
      isProjectMember,
      isTaskMember,
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
          attributes: ["id"],
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
    const isProjectMember = Boolean((task as any).projectMembers?.length > 0);
    const isCreator = task.createdBy === userId;
    const isAssignee = assignees.some((a: any) => a.id === userId);
    const isTaskMember = isCreator || isAssignee;

    return {
      task,
      isProjectMember,
      isTaskMember,
    };
  }
}
