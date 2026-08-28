import { Model, DataTypes, Sequelize, Optional } from "sequelize";

export type Role = "MEMBER" | "OWNER";
export type MembershipStatus = "ACTIVE" | "PENDING";
export interface ProjectMembersAttributes {
  id: string;
  userId: string;
  projectId: string;
  role?: Role;
  createdAt?: Date;
  updatedAt?: Date;
  membershipStatus?: MembershipStatus;
}

export type ProjectMembersCreationAttributes = Optional<
  ProjectMembersAttributes,
  "id" | "role" | "membershipStatus"
>;
export class ProjectMembers
  extends Model<ProjectMembersAttributes, ProjectMembersCreationAttributes>
  implements ProjectMembersAttributes
{
  declare public id: string;
  declare public userId: string;
  declare public projectId: string;
  declare public role: Role;
  declare public membershipStatus: MembershipStatus;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof ProjectMembers => {
  ProjectMembers.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "project_id",
        references: {
          model: "projects",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      membershipStatus: {
        type: DataTypes.ENUM("ACTIVE", "PENDING"),
        allowNull: false,
        field: "membership_status",
        defaultValue: "PENDING",
      },
      role: {
        type: DataTypes.ENUM("MEMBER", "OWNER"),
        allowNull: false,
        validate: { notEmpty: { msg: "Role is required" } },
        defaultValue: "MEMBER",
      },
    },
    {
      sequelize,
      tableName: "project_members",
      timestamps: true,
      underscored: true,
    },
  );

  return ProjectMembers;
};
