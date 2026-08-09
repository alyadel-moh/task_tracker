import { Task, TaskHistory, Project, User } from "../models";
import { AuthRequest } from "../types/AuthRequest";
import { Response, NextFunction } from "express";
async function findOwnedTask(userId: string, taskId: string): Promise<boolean> {
  const task = await Task.findOne({
    where: { id: taskId },
    include: [
      {
        model: Project,
        as: "project",
        where: { userId },
      },
    ],
  });
  return !!task;
}

async function getTaskHistory(
  req: AuthRequest<{ taskId: string }>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { taskId } = req.params;

    const taskOwned = await findOwnedTask(req.user.id, taskId);
    if (!taskOwned) {
      return res.status(404).json({
        error: "Not Found",
        message: "Task not found or you do not have permission to access it",
      });
    }

    const taskHistory = await TaskHistory.findAll({
      where: { taskId },
      include: [
        {
          model: User,
          as: "actor",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(taskHistory);
  } catch (err) {
    next(err);
  }
}

export { getTaskHistory };
