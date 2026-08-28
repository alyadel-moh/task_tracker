import { Model, DataTypes, Sequelize, Optional } from "sequelize";

export interface TimeEntryAttributes {
  id: string;
  note?: string | null;
  durationMinutes: number;
  entryDate: Date;
  taskId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TimeEntryCreationAttributes = Optional<TimeEntryAttributes, "id">;

export class TimeEntry
  extends Model<TimeEntryAttributes, TimeEntryCreationAttributes>
  implements TimeEntryAttributes
{
  declare public id: string;
  declare public note: string | null;
  declare public durationMinutes: number;
  declare public entryDate: Date;
  declare public taskId: string;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof TimeEntry => {
  TimeEntry.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: {
            args: [1],
            msg: "Duration must be a positive number of minutes",
          },
        },
      },
      entryDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      taskId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tasks",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    },
    {
      sequelize,
      tableName: "time_entries",
      timestamps: true,
      underscored: true,
    },
  );

  return TimeEntry;
};
