import { Transaction } from "sequelize";
import { User, ProjectMembers, Project } from "../models";
import { Role } from "../models/projectMembers";

interface Params {
  projectId: string;
  id?: string;
}
export class ProjectMemberRepository {
  static async getAll(projectId: string) {
    return ProjectMembers.findAll({
      where: { projectId, membershipStatus: "ACTIVE" },
      attributes: ["id", "userId", "role", "membershipStatus", "createdAt"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "photoUrl"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
  }

  static async getMemberByProjectId(params: Params) {
    return ProjectMembers.findOne({
      where: {
        id: params.id,
        projectId: params.projectId,
        membershipStatus: "ACTIVE",
      },
      attributes: ["id", "role", "userId"],
    });
  }
  static async addMember(projectId: string, userId: string, role: Role) {
    return ProjectMembers.create({
      projectId,
      userId,
      role,
    });
  }
  static async getPendingInvitations(userId: string) {
    return ProjectMembers.findAll({
      where: { userId, membershipStatus: "PENDING" },
      attributes: ["id", "role"],
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
        },
      ],
    });
  }
  static async acceptInvitation(
    userId: string,
    projectId: string,
    transaction?: Transaction,
  ) {
    const [affectedCount] = await ProjectMembers.update(
      { membershipStatus: "ACTIVE" },
      {
        where: {
          projectId,
          userId,
          membershipStatus: "PENDING",
        },
        transaction,
      },
    );

    if (affectedCount === 0) {
      throw {
        status: 404,
        message: "No pending invitation found for this project",
      };
    }

    return ProjectMembers.findOne({
      where: {
        projectId,
        userId,
      },
      attributes: ["id", "role"],
      include: [
        {
          model: Project,
          as: "project",
        },
      ],
      transaction,
    });
  }
  static async getMembershipwithProject(userId: string, projectId: string) {
    return ProjectMembers.findOne({
      where: { projectId, userId },
      attributes: ["id", "role"],
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
        },
      ],
    });
  }
  static async getAssignedProjects(userId: string) {
    return ProjectMembers.findAll({
      where: { userId, membershipStatus: "ACTIVE" },
      attributes: ["id", "role"],
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "description", "createdAt", "updatedAt"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }
  static async addCreatorToProject(
    projectId: string,
    userId: string,
    transaction?: Transaction,
  ) {
    return ProjectMembers.create(
      {
        projectId,
        userId,
        role: "OWNER",
        membershipStatus: "ACTIVE",
      },
      { transaction },
    );
  }
  static async countOwners(projectId: string) {
    return ProjectMembers.count({
      where: { projectId, role: "OWNER" },
    });
  }

  static async getPendingInvitation(id: string) {
    return ProjectMembers.findOne({
      where: { id, membershipStatus: "PENDING" },
      attributes: ["id", "projectId"],
    });
  }
  static async declineInvitation(userId: string, projectId: string) {
    return ProjectMembers.destroy({
      where: { userId, projectId, membershipStatus: "PENDING" },
    });
  }
}
