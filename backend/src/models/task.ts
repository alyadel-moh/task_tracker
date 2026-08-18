import { Model, DataTypes, Sequelize, Optional } from "sequelize";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskAttributes {
  id: string;
  name: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate?: Date | null;
  estimatedTime?: number | null;
  projectId: string;
  statusId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TaskCreationAttributes = Optional<
  TaskAttributes,
  "id" | "priority" | "description" | "dueDate" | "estimatedTime" | "statusId"
>;

export class Task
  extends Model<TaskAttributes, TaskCreationAttributes>
  implements TaskAttributes
{
  declare public id: string;
  declare public name: string;
  declare public description: string | null;
  declare public priority: TaskPriority;
  declare public dueDate: Date | null;
  declare public estimatedTime: number | null;
  declare public projectId: string;
  declare public statusId: string | null;

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
      statusId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "status_id",
        references: {
          model: "statuses",
          key: "id",
        },
        onDelete: "RESTRICT", // Prevents deleting a status if tasks exist in it
        onUpdate: "CASCADE",
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
