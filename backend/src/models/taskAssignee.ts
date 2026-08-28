import {
  Model,
  DataTypes,
  Sequelize,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";

export interface TaskAssigneeAttributes {
  taskId: string;
  userId: string;
  projectId: string;
}

export type TaskAssigneeCreationAttributes = TaskAssigneeAttributes;

export class TaskAssignee extends Model<
  InferAttributes<TaskAssignee>,
  InferCreationAttributes<TaskAssignee>
> {
  declare public taskId: string;
  declare public userId: string;
  declare public projectId: string;
}

export default (sequelize: Sequelize): typeof TaskAssignee => {
  TaskAssignee.init(
    {
      taskId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: "tasks", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: "projects", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    },
    {
      sequelize,
      tableName: "task_assignees",
      timestamps: false,
      underscored: true,
    },
  );

  return TaskAssignee;
};
