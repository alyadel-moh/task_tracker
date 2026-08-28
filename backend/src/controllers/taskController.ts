import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { TaskService } from "../services/taskService";
async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const projectId = req.params.projectId;
    const {
      name,
      description,
      statusId,
      estimatedTime,
      dueDate,
      priority,
      assignees,
    } = req.body;
    const newTask = await TaskService.create(
      projectId,
      name,
      description,
      statusId,
      estimatedTime,
      dueDate,
      priority,
      req.user.id,
      assignees,
    );
    return res.status(201).json({
      message: "Task created successfully",
      newTask,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function getById(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const task = await TaskService.getById(
      req.params.projectId,
      req.params.id,
      req.user.id,
    );
    return res.status(200).json(task);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function getAll(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { projectId } = req.params;
    const { search, statusId, priority, overdue, assigneeId } = req.query;
    const tasks = await TaskService.getAll(
      projectId,
      search as string,
      statusId as string | string[],
      priority as string | string[],
      overdue === "true" ? true : false,
      req.user.id,
      assigneeId as string,
    );
    return res.status(200).json(tasks);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { projectId, id } = req.params;
    const {
      name,
      description,
      statusId,
      estimatedTime,
      dueDate,
      priority,
      assigneeIds,
    } = req.body;
    const { updatedFields, changedLabels, detailedHistoryEntries, overrun } =
      await TaskService.update(
        projectId,
        id,
        name,
        description,
        statusId,
        estimatedTime,
        dueDate,
        priority,
        req.user.id,
        assigneeIds,
      );
    return res.status(200).json({
      task: updatedFields,
      message: `${changedLabels.join(", ")} updated successfully`,
      overrun,
      historyEntries: detailedHistoryEntries,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function remove(
  req: AuthRequest<{ id: string; projectId: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    await TaskService.remove(req.user.id, req.params.projectId, req.params.id);
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

export { create, getAll, update, remove, getById };
