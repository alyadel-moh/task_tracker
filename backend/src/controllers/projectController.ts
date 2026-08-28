import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { ProjectService } from "../services/projectService";
async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { project, id } = await ProjectService.create(
      req.body.name,
      req.body.description,
      req.user.id,
    );
    return res.status(201).json({
      message: "Project created successfully",
      assignedProjectMembership: {
        id,
        role: "OWNER",
        project,
      },
    });
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
    const { updatedField, changedLabel } = await ProjectService.update(
      req.params.id,
      req.user.id,
      req.body,
    );
    return res.status(200).json({
      message: `${changedLabel || "Project"} updated successfully`,
      project: updatedField,
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
    await ProjectService.remove(req.params.id, req.user.id);
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

export { create, update, remove };
