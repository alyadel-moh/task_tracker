import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { Column, Project, sequelize } from "../models";
import { ColumnCreationAttributes } from "../models/column";

interface CreateProjectBody {
  name: string;
  description?: string;
}

interface UpdateProjectBody {
  name?: string;
  description?: string;
}

async function create(
  req: AuthRequest<
    Record<string, never>,
    Record<string, never>,
    CreateProjectBody
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res
      .status(400)
      .json({ error: "BadRequest", message: "Project name is required" });
  }
  const transaction = await sequelize.transaction();

  try {
    const project = await Project.create(
      {
        userId: req.user.id,
        name: name.trim(),
        description: description || null,
      },
      { transaction },
    );
    const defaultColumns: ColumnCreationAttributes[] = [
      {
        name: "TODO",
        position: 0,
        isDefault: true,
        mappedStatus: "TODO",
        projectId: project.id,
      },
      {
        name: "IN_PROGRESS",
        position: 1,
        isDefault: true,
        mappedStatus: "IN_PROGRESS",
        projectId: project.id,
      },
      {
        name: "IN_REVIEW",
        position: 2,
        isDefault: true,
        mappedStatus: "IN_REVIEW",
        projectId: project.id,
      },
      {
        name: "DONE",
        position: 3,
        isDefault: true,
        mappedStatus: "DONE",
        projectId: project.id,
      },
    ];
    await Column.bulkCreate(defaultColumns, { transaction });
    await transaction.commit();
    return res
      .status(201)
      .json({ message: "Project created successfully", project });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
}

async function getAll(
  req: AuthRequest<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const projects = await Project.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "ASC"]],
    });
    return res.status(200).json(projects);
  } catch (err) {
    next(err);
  }
}

async function update(
  req: AuthRequest<{ id: string }, Record<string, never>, UpdateProjectBody>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { name, description } = req.body;

    const project = await Project.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!project) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Project not found" });
    }

    const updatedField: UpdateProjectBody = {};
    const changedLabels: string[] = [];

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({
          error: "BadRequest",
          message: "Project name cannot be empty",
        });
      }
      project.name = trimmedName;
      updatedField.name = trimmedName;
      changedLabels.push("Name");
    }
    if (description !== undefined) {
      project.description = description;
      updatedField.description = description;
      changedLabels.push("Description");
    }
    if (changedLabels.length > 0) {
      await project.save();
    }

    return res.status(200).json({
      status: "success",
      message: `${changedLabels.join(", ") || "Project"} updated successfully`,
      project: updatedField,
    });
  } catch (err) {
    next(err);
  }
}

async function remove(
  req: AuthRequest<
    { id: string },
    Record<string, never>,
    Record<string, never>
  >,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!project) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Project not found" });
    }
    await project.destroy();
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export { create, getAll, update, remove };
