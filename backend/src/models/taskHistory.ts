import { Model, DataTypes, Sequelize, Optional } from "sequelize";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface HistoryAttributes {
  id: string;
  taskId: string;
  actorId: string;
  eventType: string;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt?: Date;
}

export interface HistoryCreationAttributes extends Optional<
  HistoryAttributes,
  | "id"
  | "taskId"
  | "actorId"
  | "fieldChanged"
  | "oldValue"
  | "newValue"
  | "eventType"
> {}

export class TaskHistory
  extends Model<HistoryAttributes, HistoryCreationAttributes>
  implements HistoryAttributes
{
  declare public id: string;
  declare public taskId: string;
  declare public actorId: string;
  declare public eventType: string;
  declare public fieldChanged: string | null;
  declare public oldValue: string | null;
  declare public newValue: string | null;
  declare public createdAt: Date;
}

export default (sequelize: Sequelize): typeof TaskHistory => {
  TaskHistory.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      taskId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "task_id",
        references: {
          model: "tasks",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      actorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "actor_id",
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
      },
      eventType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "event_type",
      },
      fieldChanged: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      oldValue: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      newValue: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "history_records",
      timestamps: true,
      updatedAt: false,
      underscored: true,
    },
  );

  return TaskHistory;
};
