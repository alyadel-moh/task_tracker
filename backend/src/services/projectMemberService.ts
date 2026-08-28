import sequelize from "../models";
import { Role } from "../models/projectMembers";
import { ProjectMemberRepository } from "../repositories/projectMemberRepository";
import { TaskRepository } from "../repositories/taskReposiotry";
import { AuthRepository } from "../repositories/authRepository";
import { isMember, isOwner } from "../utils/projectGaurds";

export class ProjectMemberService {
  static async getAll(projectId: string, userId: string) {
    const ismember = await isMember(userId, projectId);
    if (!ismember) {
      throw { status: 403, message: "You are not a member of this project" };
    }
    return ProjectMemberRepository.getAll(projectId);
  }

  static async updateRole(
    id: string | undefined,
    projectId: string,
    userId: string,
    role: Role,
  ) {
    const isowner = await isOwner(userId, projectId);
    if (!isowner) {
      throw { status: 403, message: "You are not the owner of this project" };
    }
    if (!role || !["MEMBER", "OWNER"].includes(role)) {
      throw {
        status: 400,
        message: "Invalid role. Allowed values: 'MEMBER', 'OWNER'",
      };
    }
    const projectMember = await ProjectMemberRepository.getMemberByProjectId({
      id,
      projectId,
    });
    if (!projectMember) {
      throw { status: 404, message: "Project member not found" };
    }
    if (projectMember.role === "OWNER" && role === "MEMBER") {
      const ownerCount = await ProjectMemberRepository.countOwners(projectId);

      if (ownerCount <= 1) {
        throw {
          status: 400,
          message: "Cannot demote the only remaining project owner",
        };
      }
    }
    await projectMember.update({ role });
  }

  static async removeMember(
    id: string | undefined,
    projectId: string,
    userId: string,
  ) {
    const isowner = await isOwner(userId, projectId);
    if (!isowner) {
      throw { status: 403, message: "You are not the owner of this project" };
    }
    const projectMember = await ProjectMemberRepository.getMemberByProjectId({
      projectId,
      id,
    });
    if (!projectMember) {
      throw { status: 404, message: "Project member not found" };
    }
    if (projectMember.role === "OWNER") {
      const ownerCount = await ProjectMemberRepository.countOwners(projectId);
      if (ownerCount <= 1) {
        throw {
          status: 400,
          message: "Cannot remove the only remaining project owner",
        };
      }
    }
    const transaction = await sequelize.transaction();
    try {
      await TaskRepository.removeAssignedUserFromTask(
        projectId,
        projectMember.userId,
        transaction,
      );
      await projectMember.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  static async addMember(
    projectId: string,
    email: string,
    userId: string,
    role: Role,
  ) {
    const projectOwned = await isOwner(userId, projectId);
    if (!projectOwned) {
      throw { status: 403, message: "You are not the owner of this project" };
    }
    const user = await AuthRepository.getUserByEmail(email);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    const existingMember = await isMember(user.id, projectId);
    if (existingMember) {
      throw {
        status: 400,
        message: `User is already a ${existingMember.role} of this project`,
      };
    }
    const projectMember = await ProjectMemberRepository.addMember(
      projectId,
      user.id,
      role,
    );
    return { projectMember, user };
  }
  static async leaveProject(projectId: string, userId: string) {
    const projectMember = await isMember(userId, projectId);
    if (!projectMember) {
      throw { status: 404, message: "You are not a member of this project" };
    }
    if (projectMember.role === "OWNER") {
      const ownerCount = await ProjectMemberRepository.countOwners(projectId);
      if (ownerCount <= 1) {
        throw {
          status: 400,
          message:
            "Cannot leave the project as you are the only remaining owner",
        };
      }
    }
    const transaction = await sequelize.transaction();
    try {
      await TaskRepository.removeAssignedUserFromTask(
        projectId,
        userId,
        transaction,
      );
      await projectMember.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async cancelInvitation(
    ownerId: string,
    projectId: string,
    id: string,
  ) {
    const projectOwned = await isOwner(ownerId, projectId);
    if (!projectOwned) {
      throw { status: 403, message: "You are not the owner of this project" };
    }
    const projectMember =
      await ProjectMemberRepository.getPendingInvitation(id);
    if (!projectMember) {
      throw { status: 404, message: "Pending invitation not found" };
    }
    await projectMember.destroy();
  }

  static async acceptInvitation(projectId: string, userId: string) {
    return await ProjectMemberRepository.acceptInvitation(userId, projectId);
  }

  static async declineInvitation(projectId: string, userId: string) {
    const projectMember = await ProjectMemberRepository.declineInvitation(
      userId,
      projectId,
    );
    if (!projectMember) {
      throw { status: 404, message: "No pending invitation found" };
    }
  }

  static async getAssignedProjects(userId: string) {
    return (await ProjectMemberRepository.getAssignedProjects(userId)) || [];
  }

  static async getPendingInvitations(userId: string) {
    return (await ProjectMemberRepository.getPendingInvitations(userId)) || [];
  }
}
