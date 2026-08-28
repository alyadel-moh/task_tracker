import { TaskHistoryService } from "../services/taskHistoryService";
import { AuthRequest } from "../types/AuthRequest";
import { Response, NextFunction } from "express";

async function getTaskHistory(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const taskHistory = await TaskHistoryService.getTaskHistory(
      req.params.taskId,
      req.user.id,
    );
    return res.status(200).json(taskHistory);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

export { getTaskHistory };
