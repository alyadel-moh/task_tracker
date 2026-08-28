import { Op, Transaction } from "sequelize";
import { Status } from "../models";
import { StatusCreationAttributes } from "../models/status";

export class StatusRepository {
  static async getByIdAndProjectId(
    id: string,
    projectId: string,
    transaction?: Transaction,
  ) {
    return Status.findOne({
      where: { id, projectId },
      attributes: ["id", "name", "position", "isDefault", "projectId"],
      transaction,
    });
  }
  static async create(
    projectId: string,
    name: string,
    position: number,
    transaction?: Transaction,
  ) {
    return Status.create(
      {
        name: name.trim(),
        position,
        projectId,
        isDefault: false,
      },
      { transaction },
    );
  }
  static async bulkCreateDefaultStatuses(
    defaultStatuses: StatusCreationAttributes[],
    transaction?: Transaction,
  ) {
    return Status.bulkCreate(defaultStatuses, { transaction });
  }

  static async getMaximumPositionStatus(
    projectId: string,
    transaction?: Transaction,
  ) {
    return Status.findOne({
      where: { projectId },
      order: [["position", "DESC"]],
      attributes: ["position"],
      transaction,
    });
  }

  static async getAll(projectId: string, transaction?: Transaction) {
    return Status.findAll({
      where: { projectId },
      order: [["position", "ASC"]],
      attributes: ["id", "name", "position", "isDefault"],
      transaction,
    });
  }

  static async getStatusesinProject(
    projectId: string,
    idsToFetch: (string | null | undefined)[],
    transaction?: Transaction,
  ) {
    const cleanIds = idsToFetch.filter((id): id is string => Boolean(id));

    if (cleanIds.length === 0) {
      return [];
    }

    return Status.findAll({
      where: {
        id: { [Op.in]: cleanIds },
        projectId,
      },
      attributes: ["id", "name"],
      transaction,
    });
  }
  static async getDefaultStatusForProject(
    projectId: string,
    transaction?: Transaction,
  ) {
    return Status.findOne({
      where: {
        projectId,
        isDefault: true,
      },
      order: [["position", "ASC"]],
      attributes: ["id"],
      transaction,
    });
  }
  static async decrementPositionsAfterDeletion(
    projectId: string,
    deletedPosition: number,
    transaction?: Transaction,
  ) {
    return Status.decrement("position", {
      by: 1,
      where: {
        projectId,
        position: { [Op.gt]: deletedPosition },
      },
      transaction,
    });
  }
}
