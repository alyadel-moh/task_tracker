import { Model, DataTypes, Sequelize, Optional } from "sequelize";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskAttributes {
  id: string;
  name: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  estimatedTime?: number | null;
  projectId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TaskCreationAttributes = Optional<
  TaskAttributes,
  "id" | "status" | "priority" | "description" | "dueDate" | "estimatedTime"
>;

export class Task
  extends Model<TaskAttributes, TaskCreationAttributes>
  implements TaskAttributes
{
  declare public id: string;
  declare public name: string;
  declare public description: string | null;
  declare public status: TaskStatus;
  declare public priority: TaskPriority;
  declare public dueDate: Date | null;
  declare public estimatedTime: number | null;
  declare public projectId: string;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof Task => {
  Task.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"),
        defaultValue: "TODO",
      },
      priority: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH"),
        defaultValue: "MEDIUM",
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      estimatedTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "projects",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    },
    {
      sequelize,
      tableName: "tasks",
      timestamps: true,
      underscored: true,
    },
  );

  return Task;
};
