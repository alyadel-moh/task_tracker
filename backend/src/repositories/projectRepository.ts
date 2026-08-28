import { Project, ProjectMembers } from "../models";
import { Transaction } from "sequelize";
export class ProjectRepository {
  static async create(
    data: { name: string; description: string | null; userId: string },
    transaction?: Transaction,
  ): Promise<Project> {
    return Project.create(data, { transaction });
  }
  static async getProjectWithMember(projectId: string, userId: string) {
    return await Project.findByPk(projectId, {
      include: [
        {
          model: ProjectMembers,
          as: "members",
          where: {
            userId,
            membershipStatus: "ACTIVE",
          },
          required: false, // LEFT JOIN so we can distinguish 404 vs 403
        },
      ],
    });
  }
}
