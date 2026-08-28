import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { StatusService } from "../services/StatusService";

async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { projectId, id } = req.params;
    const { name, position } = req.body;
    const { updatedFields } = await StatusService.update(
      projectId,
      id,
      req.user.id,
      name,
      position,
    );
    return res.status(200).json({
      status: "success",
      message: "Status updated successfully",
      newStatus: updatedFields,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}
async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const { projectId } = req.params;
  const { name } = req.body;
  try {
    const newStatus = await StatusService.create(projectId, req.user.id, name);
    return res.status(201).json({
      message: "Status created successfully",
      newStatus,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function remove(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { projectId, id } = req.params;

    await StatusService.remove(projectId, id, req.user.id);

    return res.status(200).json({ message: "Status deleted successfully" });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}
async function getAll(
  req: AuthRequest<
    { projectId: string },
    Record<string, never>,
    Record<string, never>
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { projectId } = req.params;
    const statuses = await StatusService.getAll(projectId, req.user.id);
    return res.status(200).json(statuses);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}
export { update, create, remove, getAll };
