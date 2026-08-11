import { Response, NextFunction } from "express";
import { Op, WhereOptions } from "sequelize";
import { AuthRequest } from "../types/AuthRequest";
import { Task, Project, User, TaskHistory } from "../models";
import { TaskPriority, TaskStatus } from "../models/task";
import {
  recordTaskCreated,
  recordTaskUpdated,
  recordTaskDeleted,
} from "../services/task_history";
interface CreateTaskBody {
  name: string;
  description?: string;
  status?: string;
  estimatedTime?: number;
  dueDate?: string;
  priority: string;
}

interface UpdateTaskBody {
  name?: string;
  description?: string;
  status?: string;
  estimatedTime?: number;
  dueDate?: Date;
  priority?: string;
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

async function create(
  req: AuthRequest<{ projectId: string }, {}, CreateTaskBody>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { name, description, status, estimatedTime, dueDate, priority } =
      req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ error: "BadRequest", message: "Task name is required" });
    }

    if (!priority) {
      return res
        .status(400)
        .json({ error: "BadRequest", message: "Task priority is required" });
    }

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

    const newTask = await Task.create({
      name: name.trim(),
      description: description || null,
      status: (status as TaskStatus) || "TODO",
      estimatedTime: estimatedTime ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority as TaskPriority,
      projectId: req.params.projectId,
    });
    const historyEntry = await recordTaskCreated(newTask.id, req.user.id);
    const taskHistoryEntry = await TaskHistory.findOne({
      where: { id: historyEntry?.id },
      include: [
        {
          model: User,
          as: "actor",
          attributes: ["id", "name", "email"],
        },
      ],
    });

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
    return res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

async function getAll(
  req: AuthRequest<{ projectId: string }, {}, {}, TaskQuery>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { projectId } = req.params;
    const { search, status, priority, overdue } = req.query;

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

    if (status) {
      const statusList = Array.isArray(status) ? status : [status];
      if (statusList.length > 0) {
        whereClause.status = { [Op.in]: statusList };
      }
    }

    if (priority) {
      const priorityList = Array.isArray(priority) ? priority : [priority];
      if (priorityList.length > 0) {
        whereClause.priority = { [Op.in]: priorityList };
      }
    }

    if (overdue === "true" || overdue === true) {
      whereClause.dueDate = { [Op.lt]: new Date() };
      whereClause.status = whereClause.status || { [Op.ne]: "DONE" };
    }

    const tasks = await Task.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

async function update(
  req: AuthRequest<{ id: string; projectId: string }, {}, UpdateTaskBody>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { name, description, status, estimatedTime, dueDate, priority } =
      req.body;

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
    const before: UpdateTaskBody = {
      name: task.name,
      description: task.description ?? undefined,
      status: task.status,
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
    if (description !== undefined && description !== task.description) {
      task.description = description;
      updatedFields.description = description;
      changedLabels.push("Description");
    }
    if (status !== undefined && status !== task.status) {
      task.status = status as TaskStatus;
      updatedFields.status = status;
      changedLabels.push("Status");
    }
    if (estimatedTime !== undefined && estimatedTime !== task.estimatedTime) {
      task.estimatedTime = estimatedTime;
      updatedFields.estimatedTime = estimatedTime;
      changedLabels.push("Estimated time");
    }
    if (
      dueDate !== undefined &&
      (dueDate ? new Date(dueDate).getTime() : null) !==
        (task.dueDate ? task.dueDate.getTime() : null)
    ) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
      updatedFields.dueDate = dueDate;
      changedLabels.push("Due date");
    }
    if (priority !== undefined && priority !== task.priority) {
      task.priority = priority as TaskPriority;
      updatedFields.priority = priority;
      changedLabels.push("Priority");
    }

    await task.save();

    const targetDate = dueDate
      ? new Date(dueDate)
      : task.dueDate
        ? new Date(task.dueDate)
        : undefined;
    const after = {
      name: name ?? task.name,
      description: description ?? task.description ?? undefined,
      status: status ?? task.status,
      estimatedTime: estimatedTime ?? task.estimatedTime ?? undefined,
      dueDate: targetDate ? new Date(targetDate) : undefined,
      priority: priority ?? task.priority,
    };

    const historyEntries = await recordTaskUpdated(
      task.id,
      req.user.id,
      before,
      after,
    );
    const detailedHistoryEntries = await Promise.all(
      (historyEntries || []).map((entry) =>
        TaskHistory.findOne({
          where: { id: entry?.id },
          include: [
            {
              model: User,
              as: "actor",
              attributes: ["id", "name", "email"],
            },
          ],
        }),
      ),
    );

    const message = changedLabels.length
      ? `${changedLabels.join(", ")} updated successfully!`
      : "No changes made";

    return res.status(200).json({
      task: updatedFields,
      message,
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
    const taskHistoryEntry = await TaskHistory.findOne({
      where: { id: historyEntry?.id },
      include: [
        {
          model: User,
          as: "actor",
          attributes: ["id", "name", "email"],
        },
      ],
    });
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
