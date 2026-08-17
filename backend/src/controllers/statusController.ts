import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import { AuthRequest } from "../types/AuthRequest";
import { Status, sequelize, Project } from "../models";

interface UpdateStatusBody {
  name?: string;
  position?: number;
}
async function update(
  req: AuthRequest<
    { projectId: string; statusId: string },
    Record<string, never>,
    UpdateStatusBody
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const transaction = await sequelize.transaction();

  try {
    const { projectId, statusId } = req.params;
    const { name, position } = req.body;

    const status = await Status.findOne({
      where: { id: statusId, projectId },
      include: [
        {
          model: Project,
          as: "project",
          where: { userId: req.user.id },
        },
      ],
      transaction,
    });

    if (!status) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "Not Found", message: "Status not found" });
    }
    const updatedFields: UpdateStatusBody = {};
    const updatedLabels: string[] = [];
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        await transaction.rollback();
        return res.status(400).json({
          error: "BadRequest",
          message: "Status name cannot be empty",
        });
      }
      updatedFields.name = trimmedName;
      updatedLabels.push("Name");
      status.name = trimmedName;
    }

    if (position !== undefined && position !== status.position) {
      const oldPosition = status.position;
      const newPosition = position;

      if (newPosition < oldPosition) {
        await Status.increment("position", {
          by: 1,
          where: {
            projectId: status.projectId,
            position: {
              [Op.gte]: newPosition,
              [Op.lt]: oldPosition,
            },
            id: { [Op.ne]: status.id },
          },
          transaction,
        });
      } else if (newPosition > oldPosition) {
        await Status.decrement("position", {
          by: 1,
          where: {
            projectId: status.projectId,
            position: {
              [Op.gt]: oldPosition,
              [Op.lte]: newPosition,
            },
            id: { [Op.ne]: status.id },
          },
          transaction,
        });
      }
      status.position = newPosition;
      updatedFields.position = newPosition;
      updatedLabels.push("Position");
    }
    await status.save({ transaction });
    await transaction.commit();
    return res.status(200).json({
      status: "success",
      message: "Status updated successfully",
      updatedFields: updatedFields,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
}
async function create(
  req: AuthRequest<
    { projectId: string },
    Record<string, never>,
    { name: string }
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const { projectId } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res
      .status(400)
      .json({ error: "BadRequest", message: "Status name is required" });
  }
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({
      where: { id: projectId, userId: req.user.id },
      transaction,
    });

    if (!project) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "Not Found", message: "Project not found" });
    }

    const maxPositionStatus = await Status.findOne({
      where: { projectId },
      order: [["position", "DESC"]],
      transaction,
    });

    const newPosition = maxPositionStatus ? maxPositionStatus.position + 1 : 0;

    const newStatus = await Status.create(
      {
        name: name.trim(),
        position: newPosition,
        projectId,
        isDefault: false,
      },
      { transaction },
    );

    await transaction.commit();
    return res.status(201).json({
      message: "Status created successfully",
      newStatus,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
}

async function remove(
  req: AuthRequest<
    { projectId: string; statusId: string },
    Record<string, never>,
    Record<string, never>
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const transaction = await sequelize.transaction();
  try {
    const { projectId, statusId } = req.params;

    const status = await Status.findOne({
      where: { id: statusId, projectId },
      include: [
        {
          model: Project,
          as: "project",
          where: { userId: req.user.id },
        },
      ],
      transaction,
    });

    if (!status) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "Not Found", message: "Status not found" });
    }
    if (status.isDefault) {
      await transaction.rollback();
      return res.status(400).json({
        error: "BadRequest",
        message: "Default statuses cannot be deleted",
      });
    }
    const deletedposition = status.position;
    await status.destroy({ transaction });
    await Status.decrement("position", {
      by: 1,
      where: {
        projectId: status.projectId,
        position: { [Op.gt]: deletedposition },
      },
      transaction,
    });
    await transaction.commit();
    return res.status(200).json({ message: "Status deleted successfully" });
  } catch (err) {
    await transaction.rollback();
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

    const project = await Project.findOne({
      where: { id: projectId, userId: req.user.id },
    });

    if (!project) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Project not found" });
    }

    const statuses = await Status.findAll({
      where: { projectId },
      order: [["position", "ASC"]],
    });

    return res.status(200).json(statuses);
  } catch (err) {
    next(err);
  }
}
export { update, create, remove, getAll };
