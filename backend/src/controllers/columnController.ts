import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import { AuthRequest } from "../types/AuthRequest";
import { Column, sequelize, Project } from "../models";

interface UpdateColumnBody {
  name?: string;
  position?: number;
}
async function update(
  req: AuthRequest<
    { projectId: string; columnId: string },
    Record<string, never>,
    UpdateColumnBody
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const transaction = await sequelize.transaction();

  try {
    const { projectId, columnId } = req.params;
    const { name, position } = req.body;

    const column = await Column.findOne({
      where: { id: columnId, projectId },
      include: [
        {
          model: Project,
          as: "project",
          where: { userId: req.user.id },
        },
      ],
      transaction,
    });

    if (!column) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "Not Found", message: "Column not found" });
    }
    const updatedFields: UpdateColumnBody = {};
    const updatedLabels: string[] = [];
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        await transaction.rollback();
        return res.status(400).json({
          error: "BadRequest",
          message: "Column name cannot be empty",
        });
      }
      updatedFields.name = trimmedName;
      updatedLabels.push("Name");
      column.name = trimmedName;
    }

    if (position !== undefined && position !== column.position) {
      const oldPosition = column.position;
      const newPosition = position;

      if (newPosition < oldPosition) {
        await Column.increment("position", {
          by: 1,
          where: {
            projectId: column.projectId,
            position: {
              [Op.gte]: newPosition,
              [Op.lt]: oldPosition,
            },
            id: { [Op.ne]: column.id },
          },
          transaction,
        });
      } else if (newPosition > oldPosition) {
        await Column.decrement("position", {
          by: 1,
          where: {
            projectId: column.projectId,
            position: {
              [Op.gt]: oldPosition,
              [Op.lte]: newPosition,
            },
            id: { [Op.ne]: column.id },
          },
          transaction,
        });
      }
      column.position = newPosition;
      updatedFields.position = newPosition;
      updatedLabels.push("Position");
    }
    await column.save({ transaction });
    await transaction.commit();
    return res.status(200).json({
      status: "success",
      message: "Column updated successfully",
      column: updatedFields,
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
      .json({ error: "BadRequest", message: "Column name is required" });
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

    const maxPositionColumn = await Column.findOne({
      where: { projectId },
      order: [["position", "DESC"]],
      transaction,
    });

    const newPosition = maxPositionColumn ? maxPositionColumn.position + 1 : 0;

    const newColumn = await Column.create(
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
      message: "Column created successfully",
      column: newColumn,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
}

async function remove(
  req: AuthRequest<
    { projectId: string; columnId: string },
    Record<string, never>,
    Record<string, never>
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const transaction = await sequelize.transaction();
  try {
    const { projectId, columnId } = req.params;

    const column = await Column.findOne({
      where: { id: columnId, projectId },
      include: [
        {
          model: Project,
          as: "project",
          where: { userId: req.user.id },
        },
      ],
      transaction,
    });

    if (!column) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "Not Found", message: "Column not found" });
    }
    if (column.isDefault) {
      await transaction.rollback();
      return res.status(400).json({
        error: "BadRequest",
        message: "Default columns cannot be deleted",
      });
    }
    const deletedposition = column.position;
    await column.destroy({ transaction });
    await Column.decrement("position", {
      by: 1,
      where: {
        projectId: column.projectId,
        position: { [Op.gt]: deletedposition },
      },
      transaction,
    });
    await transaction.commit();
    return res.status(200).json({ message: "Column deleted successfully" });
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

    const columns = await Column.findAll({
      where: { projectId },
      order: [["position", "ASC"]],
    });

    return res.status(200).json(columns);
  } catch (err) {
    next(err);
  }
}
export { update, create, remove, getAll };
