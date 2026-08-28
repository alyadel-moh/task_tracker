import sequelize, { User } from "../models";
import { TaskPriority } from "../models/task";
import { TaskHistoryService } from "./taskHistoryService";
import { isMember, isOwner } from "../utils/projectGaurds";
import { TaskRepository } from "../repositories/taskReposiotry";
import { isNumberInRange, isValidISODate } from "../utils/validators";
import { StatusRepository } from "../repositories/statusRepository";
import { TaskHistoryRepository } from "../repositories/taskHistoryRepository";
import { TimeEntryRepository } from "../repositories/timeEntryRepository";
import { isAssignee, isCreator } from "../utils/taskGaurds";
interface UpdateTaskBody {
  name?: string;
  description?: string;
  statusId?: string;
  estimatedTime?: number | null;
  dueDate?: Date | string | null;
  priority?: TaskPriority;
  statusName?: string;
  assignees?: User[] | null;
}
const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export class TaskService {
  static async create(
    projectId: string,
    name: string,
    description: string,
    statusId: string,
    estimatedTime: number,
    dueDate: Date | string | null,
    priority: TaskPriority,
    userId: string,
    assignees: string[],
  ) {
    const ismember = await isMember(userId, projectId);
    if (!ismember) {
      throw { status: 403, message: "You are not a member of this project" };
    }
    if (!name || !name.trim()) {
      throw { status: 400, message: "Task name is required" };
    }
    if (estimatedTime !== undefined && estimatedTime !== null) {
      if (
        !Number.isInteger(estimatedTime) ||
        !isNumberInRange(estimatedTime, 1, 525600)
      ) {
        throw {
          status: 400,
          message:
            "estimatedTime must be a positive number of minutes (minimum 1)",
        };
      }
    }
    if (dueDate !== undefined && dueDate !== null) {
      if (typeof dueDate === "string" && !isValidISODate(dueDate)) {
        throw {
          status: 400,
          message: "dueDate must be a valid ISO 8601 date string",
        };
      }
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
        throw { status: 400, message: "Invalid date format for dueDate" };
      }
    }

    if (priority && !ALLOWED_PRIORITIES.includes(priority as TaskPriority)) {
      throw {
        status: 400,
        message: `Invalid priority value. Allowed values: ${ALLOWED_PRIORITIES.join(", ")}`,
      };
    }
    if (assignees && assignees.length > 0) {
      const uniqueAssignees = Array.from(new Set(assignees));
      const memberChecks = await Promise.all(
        uniqueAssignees.map((id) => isMember(id, projectId)),
      );
      if (!memberChecks.every(Boolean)) {
        throw {
          status: 400,
          message:
            "One or more assignees are not active members of this project",
        };
      }
    }
    let targetStatus;
    if (statusId) {
      targetStatus = await StatusRepository.getByIdAndProjectId(
        statusId,
        projectId,
      );
    } else {
      targetStatus =
        await StatusRepository.getDefaultStatusForProject(projectId);
    }
    if (!targetStatus) {
      throw {
        status: 400,
        message: "No valid column status found for this project",
      };
    }
    const transaction = await sequelize.transaction();
    try {
      const newTask = await TaskRepository.create(
        projectId,
        name.trim(),
        description || null,
        targetStatus.id,
        estimatedTime ?? null,
        dueDate ? new Date(dueDate) : null,
        (priority as TaskPriority) || "MEDIUM",
        userId,
        assignees,
        transaction,
      );
      await TaskHistoryService.recordTaskCreated(
        newTask.id,
        userId,
        transaction,
      );
      await transaction.commit();
      return newTask;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async getById(projectId: string, id: string, userId: string) {
    const membership = await isMember(userId, projectId);
    if (!membership) {
      throw { status: 403, message: "You are not a member of this project" };
    }
    const task = await TaskRepository.getByIdwithStatus(id, projectId);

    if (!task) {
      throw { status: 404, message: "Task not found" };
    }
    return task;
  }

  static async getAll(
    projectId: string,
    search: string,
    statusId: string | string[],
    priority: string | string[],
    overdue: boolean | string,
    userId: string,
    assigneeId: string,
  ) {
    const ismember = await isMember(userId, projectId);
    if (!ismember) {
      throw { status: 403, message: "You are not a member of this project" };
    }
    return await TaskRepository.getAll(
      projectId,
      search,
      statusId,
      priority,
      overdue,
      assigneeId,
    );
  }
  static async update(
    projectId: string,
    id: string,
    name: string,
    description: string | null,
    statusId: string | null,
    estimatedTime: number | null,
    dueDate: Date | string | null,
    priority: TaskPriority,
    userId: string,
    assigneeIds: string[] | null,
  ) {
    const ismember = await isMember(userId, projectId);
    if (!ismember) {
      throw { status: 403, message: "You are not a member of this project" };
    }
    const isassignee = await isAssignee(id, userId, projectId);
    const iscreator = await isCreator(id, userId, projectId);
    if (!isassignee && !iscreator) {
      throw { status: 403, message: "You are not a member of this task" };
    }
    const task = await TaskRepository.getTaskWithAssignees(id, projectId);
    if (!task) {
      throw { status: 404, message: "Task not found" };
    }
    const currentTaskAssignees = (task as any).assignees || [];
    const currentAssigneeIds = currentTaskAssignees.map((a: any) => a.id);
    const currentAssigneeNames: string[] = currentTaskAssignees.map(
      (a: any) =>
        a.name || a.user?.name || a.email || a.user?.email || "Member",
    );
    const before: UpdateTaskBody = {
      name: task.name,
      description: task.description ?? undefined,
      statusId: task.statusId ?? undefined,
      estimatedTime: task.estimatedTime ?? undefined,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: task.priority,
    };
    const updatedFields: Partial<UpdateTaskBody> = {};
    const changedLabels: string[] = [];
    if (name !== undefined && name.trim() !== task.name) {
      const trimmedName = name.trim();
      if (trimmedName === "") {
        throw { status: 400, message: "Task name cannot be empty" };
      }
      task.name = trimmedName;
      updatedFields.name = trimmedName;
      changedLabels.push("Task name");
    }
    if (description !== task.description && description != undefined) {
      task.description = description || null;
      updatedFields.description = description;
      changedLabels.push("Description");
    }
    if (statusId !== undefined && statusId !== task.statusId) {
      const idsToFetch = [statusId];
      if (task.statusId) idsToFetch.push(task.statusId);

      const foundStatuses = await StatusRepository.getStatusesinProject(
        projectId,
        idsToFetch,
      );

      const newStatus = foundStatuses.find((s) => s.id === statusId);
      const oldStatus = foundStatuses.find((s) => s.id === task.statusId);

      if (!newStatus) {
        throw { status: 400, message: "Invalid statusId for this project" };
      }

      before.statusName = oldStatus?.name;
      updatedFields.statusName = newStatus.name;

      task.statusId = newStatus.id;
      updatedFields.statusId = newStatus.id;
      changedLabels.push("Status");
    }
    if (estimatedTime !== undefined && estimatedTime !== task.estimatedTime) {
      if (
        estimatedTime !== null &&
        (!Number.isInteger(estimatedTime) ||
          !isNumberInRange(estimatedTime, 1, 525600))
      ) {
        throw {
          status: 400,
          message:
            "Estimated time must be a positive number of minutes (minimum 1)",
        };
      }
      task.estimatedTime = estimatedTime;
      updatedFields.estimatedTime = estimatedTime;
      changedLabels.push("Estimated time");
    }
    if (dueDate !== undefined && dueDate !== task.dueDate) {
      if (
        dueDate !== null &&
        typeof dueDate === "string" &&
        !isValidISODate(dueDate)
      ) {
        throw {
          status: 400,
          message: "dueDate must be a valid ISO 8601 date string",
        };
      }

      const parsedDueDate = dueDate ? new Date(dueDate) : null;
      if (parsedDueDate && isNaN(parsedDueDate.getTime())) {
        throw { status: 400, message: "Invalid date format for dueDate" };
      }
      const currentMs = task.dueDate ? new Date(task.dueDate).getTime() : null;
      const parsedMs = parsedDueDate ? parsedDueDate.getTime() : null;

      if (currentMs !== parsedMs) {
        task.dueDate = parsedDueDate;
        updatedFields.dueDate = parsedDueDate
          ? parsedDueDate.toISOString()
          : null;
        changedLabels.push("Due date");
      }
    }
    if (priority !== undefined && priority !== task.priority) {
      if (!ALLOWED_PRIORITIES.includes(priority as TaskPriority)) {
        throw {
          status: 400,
          message: `Invalid priority value. Allowed values: ${ALLOWED_PRIORITIES.join(", ")}`,
        };
      }
      task.priority = priority as TaskPriority;
      updatedFields.priority = priority as TaskPriority;
      changedLabels.push("Priority");
    }
    let uniqueAssigneeIds: string[] | undefined;
    if (assigneeIds !== undefined && assigneeIds !== null) {
      uniqueAssigneeIds = Array.from(new Set(assigneeIds));

      if (uniqueAssigneeIds.length > 0) {
        const memberChecks = await Promise.all(
          uniqueAssigneeIds.map((assigneeId) =>
            isMember(assigneeId, projectId),
          ),
        );
        if (!memberChecks.every(Boolean)) {
          throw {
            status: 400,
            message:
              "One or more assignees are not active members of this project",
          };
        }
      }
      const isAssigneesChanged =
        uniqueAssigneeIds.length !== currentAssigneeIds.length ||
        uniqueAssigneeIds.some((id) => !currentAssigneeIds.includes(id));

      if (isAssigneesChanged) {
        changedLabels.push("Assignees");
      }
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
      await task.save({ transaction });
      let newAssigneeNames: string[] | undefined = undefined;
      if (
        uniqueAssigneeIds !== undefined &&
        changedLabels.includes("Assignees")
      ) {
        const updatedAssigneeObjects = await TaskRepository.updateAssignees(
          task.id,
          projectId,
          uniqueAssigneeIds,
          currentAssigneeIds,
          transaction,
        );
        updatedFields.assignees = updatedAssigneeObjects;
        newAssigneeNames = (updatedAssigneeObjects || []).map(
          (a: any) =>
            a.name || a.user?.name || a.email || a.user?.email || "Member",
        );
      }
      const after = {
        name: name ?? task.name,
        description: description ?? task.description ?? undefined,
        statusId: statusId ?? task.statusId ?? undefined,
        estimatedTime: estimatedTime ?? task.estimatedTime ?? undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        priority: priority ?? task.priority,
        statusName: updatedFields.statusName ?? before.statusName,
        assignees: updatedFields.assignees ?? before.assignees,
      };

      const historyEntries = await TaskHistoryService.recordTaskUpdated(
        task.id,
        userId,
        before,
        after,
        transaction,
        changedLabels.includes("Assignees") ? currentAssigneeNames : undefined,
        changedLabels.includes("Assignees") ? newAssigneeNames : undefined,
      );
      const detailedHistoryEntries = await Promise.all(
        (historyEntries || []).map((entry) =>
          TaskHistoryRepository.fetchHistoryWithActor(entry?.id, transaction),
        ),
      );
      const totalMinutes = await TimeEntryRepository.sumloggedTime(
        task.id,
        transaction,
      );
      const overrun =
        task.estimatedTime !== null && task.estimatedTime !== undefined
          ? totalMinutes > task.estimatedTime
          : false;
      await transaction.commit();
      return { updatedFields, changedLabels, detailedHistoryEntries, overrun };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
  static async remove(userId: string, projectId: string, id: string) {
    const projectOwned = await isOwner(userId, projectId);
    if (!projectOwned) {
      throw { status: 403, message: "You are not the owner of this project" };
    }
    const task = await TaskRepository.getById(id, projectId);
    if (!task) {
      throw { status: 404, message: "Task not found" };
    }
    const transaction = await sequelize.transaction();
    try {
      await task.destroy({ transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
