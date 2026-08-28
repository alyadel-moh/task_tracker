import { Task, TaskAssignee } from "../models";

export async function isAssignee(
  taskId: string,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const assigned = await TaskAssignee.findOne({
    where: { taskId, userId, projectId },
  });
  return !!assigned;
}

export async function isCreator(
  taskId: string,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const task = await Task.findOne({
    where: { id: taskId, projectId, createdBy: userId },
  });
  return !!task;
}
