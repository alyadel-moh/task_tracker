import { sequelize } from "../models";
import { StatusCreationAttributes } from "../models/status";
import { ProjectRepository } from "../repositories/projectRepository";
import { StatusRepository } from "../repositories/statusRepository";
import { ProjectMemberRepository } from "../repositories/projectMemberRepository";

interface UpdateProjectBody {
  name?: string;
  description?: string;
}
export class ProjectService {
  static async create(name: string, description: string, userId: string) {
    if (!name || !name.trim()) {
      throw { status: 400, message: "Project name is required" };
    }
    const transaction = await sequelize.transaction();
    try {
      const project = await ProjectRepository.create(
        { name: name.trim(), description, userId },
        transaction,
      );
      const defaultStatuses: StatusCreationAttributes[] = [
        {
          name: "TODO",
          position: 0,
          isDefault: true,
          projectId: project.id,
        },
        {
          name: "IN_PROGRESS",
          position: 1,
          isDefault: true,
          projectId: project.id,
        },
        {
          name: "DONE",
          position: 2,
          isDefault: true,
          projectId: project.id,
        },
      ];
      await StatusRepository.bulkCreateDefaultStatuses(
        defaultStatuses,
        transaction,
      );
      const projectMembership =
        await ProjectMemberRepository.addCreatorToProject(
          project.id,
          userId,
          transaction,
        );
      await transaction.commit();
      return { project, id: projectMembership.id };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  static async update(
    projectId: string,
    userId: string,
    { name, description }: UpdateProjectBody,
  ) {
    const project = await ProjectRepository.getProjectWithMember(
      projectId,
      userId,
    );
    if (!project) {
      throw { status: 404, message: "Project not found" };
    }
    const membership = (project as any).members?.[0];
    const isOwner = membership?.role === "OWNER";
    if (!isOwner) {
      throw {
        status: 403,
        message: "Access denied. Only project owners can edit project details.",
      };
    }
    const updatedField: UpdateProjectBody = {};
    let changedLabel: string = "";

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw { status: 400, message: "Project name cannot be empty" };
      }
      project.name = trimmedName;
      updatedField.name = trimmedName;
      changedLabel = "Name";
    } else if (description !== undefined) {
      project.description = description;
      updatedField.description = description;
      changedLabel = "Description";
    }
    if (Object.keys(updatedField).length !== 0) {
      await project.save();
    }
    return { updatedField, changedLabel };
  }

  static async remove(projectId: string, userId: string) {
    const project = await ProjectRepository.getProjectWithMember(
      projectId,
      userId,
    );
    if (!project) {
      throw { status: 404, message: "Project not found" };
    }
    const membership = (project as any).members?.[0];
    const isOwner = membership?.role === "OWNER";
    if (!isOwner) {
      throw {
        status: 403,
        message: "Access denied. Only project owners delete a project.",
      };
    }
    const transaction = await sequelize.transaction();
    try {
      await project.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
