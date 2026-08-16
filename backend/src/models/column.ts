import { Model, DataTypes, Sequelize, Optional } from "sequelize";

export interface ColumnAttributes {
  id: string;
  projectId: string;
  name: string;
  position: number;
  isDefault: boolean;
  mappedStatus?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ColumnCreationAttributes = Optional<
  ColumnAttributes,
  "id" | "isDefault" | "mappedStatus"
>;
export class Column
  extends Model<ColumnAttributes, ColumnCreationAttributes>
  implements ColumnAttributes
{
  declare public id: string;
  declare public projectId: string;
  declare public name: string;
  declare public position: number;
  declare public isDefault: boolean;
  declare public mappedStatus?:
    "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof Column => {
  Column.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Column name is required" } },
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_default",
      },
      mappedStatus: {
        type: DataTypes.ENUM("TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"),
        allowNull: true,
        field: "mapped_status",
        validate: {
          isIn: {
            args: [["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", null]],
            msg: "Invalid mapped status",
          },
        },
      },
    },
    {
      sequelize,
      tableName: "columns",
      timestamps: true,
      underscored: true,
    },
  );

  return Column;
};
