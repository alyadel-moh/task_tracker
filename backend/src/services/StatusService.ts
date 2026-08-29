import { Op } from "sequelize";
import { Status, sequelize } from "../models";
import { StatusRepository } from "../repositories/statusRepository";
import { TaskRepository } from "../repositories/taskReposiotry";
import { isMember } from "../utils/projectGaurds";
interface UpdateStatusBody {
  name?: string;
  position?: number;
}
export class StatusService {
  static async update(
    projectId: string,
    id: string,
    userId: string,
    name?: string,
    position?: number,
  ) {
    const ismember = await isMember(userId, projectId);
    if (!ismember) {
      throw { status: 403, message: "You are not a member of this project" };
    }

    const status = await StatusRepository.getByIdAndProjectId(id, projectId);
    if (!status) {
      throw { status: 404, message: "Status not found" };
    }

    const updatedFields: UpdateStatusBody = {};
    const updatedLabels: string[] = [];

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw { status: 400, message: "Status name cannot be empty" };
      }
      if (status.isDefault) {
        throw { status: 400, message: "Cannot update default status" };
      }
      updatedFields.name = trimmedName;
      updatedLabels.push("Name");
      status.name = trimmedName;
      await status.save();
    } else if (
      position !== undefined &&
      position >= 0 &&
      position !== status.position
    ) {
      const newPosition = position;
      const allStatuses = await StatusRepository.getAll(projectId);
      const reordered = allStatuses.filter((s) => s.id !== status.id);
      reordered.splice(newPosition, 0, status);

      for (let i = 0; i < reordered.length; i++) {
        await Status.update(
          { position: -(i + 1) },
          { where: { id: reordered[i].id } },
        );
      }
      for (let i = 0; i < reordered.length; i++) {
        await Status.update(
          { position: i },
          { where: { id: reordered[i].id } },
        );
      }

      status.position = newPosition;
      updatedFields.position = newPosition;
      updatedLabels.push("Position");
    }

    return { updatedFields, updatedLabels };
  }
  static async create(projectId: string, userId: string, name: string) {
    if (!name || !name.trim()) {
      throw { status: 400, message: "Status name cannot be empty" };
    }
    const ismember = await isMember(userId, projectId);
    if (!ismember) {
      throw { status: 403, message: "You are not a member of this project" };
    }
    const maxPositionStatus =
      await StatusRepository.getMaximumPositionStatus(projectId);
    const newPosition = maxPositionStatus ? maxPositionStatus.position + 1 : 0;
    const newStatus = await StatusRepository.create(
      projectId,
      name.trim(),
      newPosition,
    );
    return newStatus;
  }

  static async remove(projectId: string, id: string, userId: string) {
    const ismember = await isMember(userId, projectId);
    if (!ismember) {
      throw { status: 403, message: "You are not a member of this project" };
    }
    const status = await StatusRepository.getByIdAndProjectId(id, projectId);
    if (!status) {
      throw { status: 404, message: "Status not found" };
    }
    if (status.isDefault) {
      throw { status: 400, message: "Cannot delete default status" };
    }
    const taskCount = await TaskRepository.getTasksassignedwithStatusId(
      projectId,
      status.id,
    );

    if (taskCount.length > 0) {
      throw {
        status: 400,
        message: "Cannot delete status with assigned tasks",
      };
    }
    const deletedposition = status.position;
    const transaction = await sequelize.transaction();
    try {
      await status.destroy({ transaction });
      await StatusRepository.decrementPositionsAfterDeletion(
        projectId,
        deletedposition,
        transaction,
      );
      await transaction.commit();
      return { message: "Status deleted successfully" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  static async getAll(projectId: string, userId: string) {
    const ismember = await isMember(userId, projectId);
    if (!ismember) {
      throw { status: 403, message: "You are not a member of this project" };
    }

    return await StatusRepository.getAll(projectId);
  }
}
