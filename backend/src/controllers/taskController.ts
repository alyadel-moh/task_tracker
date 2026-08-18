import { Response, NextFunction } from "express";
import { Op, WhereOptions } from "sequelize";
import { AuthRequest } from "../types/AuthRequest";
import { Task, Project, User, TaskHistory, TimeEntry, Status } from "../models";
import { TaskPriority } from "../models/task";
import {
  recordTaskCreated,
  recordTaskUpdated,
  recordTaskDeleted,
} from "../services/taskHistory";
interface CreateTaskBody {
  name: string;
  description?: string;
  statusId?: string;
  estimatedTime?: number;
  dueDate?: string;
  priority?: string;
}

interface UpdateTaskBody {
  name?: string;
  description?: string;
  statusId?: string;
  estimatedTime?: number;
  dueDate?: Date | string | null;
  priority?: string;
  statusName?: string;
}

interface TaskQuery {
  search?: string;
  status?: string | string[];
  priority?: string | string[];
  overdue?: string | boolean;
}

async function findOwnedProject(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const project = await Project.findOne({
    where: { id: projectId, userId },
  });
  return !!project;
}

const isValidISODate = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== "string") return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
const isNumberInRange = (
  val: unknown,
  min: number = 0,
  max: number = 525600, // e.g. 1 year in minutes max
): boolean => {
  if (typeof val !== "number" || !Number.isFinite(val)) return false;
  return val >= min && val <= max;
};
async function fetchHistoryWithActor(historyId?: string) {
  if (!historyId) return null;
  return TaskHistory.findOne({
    where: { id: historyId },
    include: [
      { model: User, as: "actor", attributes: ["id", "name", "email"] },
    ],
  });
}
const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
async function create(
  req: AuthRequest<
    Record<string, never>,
    Record<string, never>,
    CreateTaskBody
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const projectId = req.params.projectId;
    const { name, description, statusId, estimatedTime, dueDate, priority } =
      req.body;
    const projectOwned = await findOwnedProject(req.user.id, projectId);
    if (!projectOwned) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not the owner of this project",
      });
    }
    const statusExists = await Status.findOne({
      where: { id: statusId, projectId },
    });

    if (!statusExists) {
      return res.status(404).json({
        error: "NotFound",
        message: "Status not found for this project",
      });
    }
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ error: "BadRequest", message: "Task name is required" });
    }
    if (estimatedTime !== undefined && estimatedTime !== null) {
      if (!isNumberInRange(estimatedTime, 1, 525600)) {
        return res.status(400).json({
          error: "BadRequest",
          message:
            "estimatedTime must be a positive number of minutes (minimum 1)",
        });
      }
    }
    if (dueDate !== undefined && dueDate !== null) {
      if (!isValidISODate(dueDate)) {
        return res.status(400).json({
          error: "BadRequest",
          message: "dueDate must be a valid ISO 8601 date string",
        });
      }
    }

    if (priority && !ALLOWED_PRIORITIES.includes(priority as TaskPriority)) {
      return res.status(400).json({
        status: "BadRequest",
        message: `Invalid priority value. Allowed values: ${ALLOWED_PRIORITIES.join(", ")}`,
      });
    }
    let targetStatus;
    if (statusId) {
      targetStatus = await Status.findOne({
        attributes: ["id"],
        where: {
          projectId,
          id: statusId,
        },
      });
    } else {
      targetStatus = await Status.findOne({
        attributes: ["id"],
        where: {
          projectId,
          isDefault: true,
        },
        order: [["position", "ASC"]],
      });
      // take first def one which is "TODO"
    }

    if (!targetStatus) {
      return res.status(400).json({
        error: "BadRequest",
        message: "No valid column status found for this project",
      });
    }
    const newTask = await Task.create({
      name: name.trim(),
      description: description || null,
      estimatedTime: estimatedTime ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: (priority as TaskPriority) || "MEDIUM",
      projectId: projectId,
      statusId: targetStatus.id,
    });
    const historyEntry = await recordTaskCreated(newTask.id, req.user.id);
    const taskHistoryEntry = await fetchHistoryWithActor(historyEntry?.id);

    return res.status(201).json({
      message: "Task created successfully",
      task: newTask,
      historyEntry: taskHistoryEntry,
    });
  } catch (err) {
    next(err);
  }
}

async function getById(
  req: AuthRequest<
    { id: string; projectId: string },
    Record<string, never>,
    Record<string, never>
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const projectOwned = await findOwnedProject(
      req.user.id,
      req.params.projectId,
    );
    if (!projectOwned) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not the owner of this project",
      });
    }
    const task = await Task.findOne({
      where: { id: req.params.id, projectId: req.params.projectId },
      include: [{ model: Status, as: "status", attributes: ["name"] }],
    });

    if (!task) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Task not found" });
    }
    const { status, ...taskData } = task.toJSON() as any;

    return res.status(200).json({
      ...taskData,
      statusName: status?.name ?? null,
    });
  } catch (err) {
    next(err);
  }
}

async function getAll(
  req: AuthRequest<Record<string, never>, Record<string, never>, TaskQuery>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { projectId } = req.params;
    const { search, statusId, priority, overdue } = req.query;

    const projectOwned = await findOwnedProject(req.user.id, projectId);
    if (!projectOwned) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not the owner of this project",
      });
    }

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
      statusConditions.push({ mappedStatus: { [Op.ne]: "DONE" } });
    }
    const hasStatusFilters = statusConditions.length > 0;
    const includeOptions = [
      {
        model: Status,
        as: "status",
        where: hasStatusFilters ? { [Op.and]: statusConditions } : undefined,
        required: statusConditions.length > 0,
      },
    ];
    const tasks = await Task.findAll({
      where: whereClause,
      include: includeOptions,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

async function update(
  req: AuthRequest<
    Record<string, never>,
    Record<string, never>,
    UpdateTaskBody
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { projectId, id } = req.params;
    const { name, description, statusId, estimatedTime, dueDate, priority } =
      req.body;
    const projectOwned = await findOwnedProject(req.user.id, projectId);
    if (!projectOwned) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not the owner of this project",
      });
    }

    const task = await Task.findOne({
      where: { id, projectId },
    });
    if (!task) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Task not found" });
    }
    const before: UpdateTaskBody = {
      name: task.name,
      description: task.description ?? undefined,
      statusId: task.statusId ?? undefined,
      estimatedTime: task.estimatedTime ?? undefined,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: task.priority,
    };
    if (name !== undefined && (!name || !name.trim())) {
      return res
        .status(400)
        .json({ error: "BadRequest", message: "Task name cannot be empty" });
    }

    const updatedFields: Partial<UpdateTaskBody> = {};
    const changedLabels: string[] = [];

    if (name !== undefined && name.trim() !== task.name) {
      const trimmedName = name.trim();
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

      const foundStatuses = await Status.findAll({
        where: { id: { [Op.in]: idsToFetch }, projectId },
        attributes: ["id", "name"],
      });

      const newStatus = foundStatuses.find((s) => s.id === statusId);
      const oldStatus = foundStatuses.find((s) => s.id === task.statusId);

      if (!newStatus) {
        return res.status(400).json({
          error: "BadRequest",
          message: "Invalid statusId for this project",
        });
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
        !isNumberInRange(estimatedTime, 1, 525600)
      ) {
        return res.status(400).json({
          error: "BadRequest",
          message:
            "Estimated time must be a positive number of minutes (minimum 1)",
        });
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
        return res.status(400).json({
          error: "BadRequest",
          message: "dueDate must be a valid ISO 8601 date string",
        });
      }

      const parsedDueDate = dueDate ? new Date(dueDate) : null;
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
        return res.status(400).json({
          error: "BadRequest",
          message: `Invalid priority value. Allowed values: ${ALLOWED_PRIORITIES.join(", ")}`,
        });
      }
      task.priority = priority as TaskPriority;
      changedLabels.push("Priority");
    }
    if (changedLabels.length > 0) {
      await task.save();
    }

    const after = {
      name: name ?? task.name,
      description: description ?? task.description ?? undefined,
      statusId: statusId ?? task.statusId ?? undefined,
      estimatedTime: estimatedTime ?? task.estimatedTime ?? undefined,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: priority ?? task.priority,
      statusName: updatedFields.statusName ?? before.statusName,
    };

    const historyEntries = await recordTaskUpdated(
      task.id,
      req.user.id,
      before,
      after,
    );
    const detailedHistoryEntries = await Promise.all(
      (historyEntries || []).map((entry) => fetchHistoryWithActor(entry?.id)),
    );

    const message = changedLabels.length
      ? `${changedLabels.join(", ")} updated successfully!`
      : "No changes made";

    return res.status(200).json({
      task: updatedFields,
      message,
      overrun: changedLabels.includes("Estimated time")
        ? (await TimeEntry.sum("durationMinutes", {
            where: { taskId: req.params.id },
          })) > (task.estimatedTime ?? 0)
        : undefined,
      historyEntries: detailedHistoryEntries,
    });
  } catch (err) {
    next(err);
  }
}

async function remove(
  req: AuthRequest<{ id: string; projectId: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const projectOwned = await findOwnedProject(
      req.user.id,
      req.params.projectId,
    );
    if (!projectOwned) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not the owner of this project",
      });
    }

    const task = await Task.findOne({
      where: { id: req.params.id, projectId: req.params.projectId },
    });
    if (!task) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Task not found" });
    }
    const historyEntry = await recordTaskDeleted(task.id, req.user.id);
    const taskHistoryEntry = await fetchHistoryWithActor(historyEntry?.id);
    await task.destroy();
    return res.status(200).json({
      message: "Task deleted successfully",
      historyEntry: taskHistoryEntry,
    });
  } catch (err) {
    next(err);
  }
}

export { create, getAll, update, remove, getById };
