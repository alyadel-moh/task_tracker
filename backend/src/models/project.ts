import { Model, DataTypes, Sequelize, Optional } from "sequelize";

export interface ProjectAttributes {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectCreationAttributes = Optional<
  ProjectAttributes,
  "id" | "description"
>;
export class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  declare public id: string;
  declare public userId: string;
  declare public name: string;
  declare public description: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof Project => {
  Project.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Project name is required" } },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "projects",
      timestamps: true,
      underscored: true,
    },
  );

  return Project;
};
