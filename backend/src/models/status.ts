import { Model, DataTypes, Sequelize, Optional } from "sequelize";

export interface StatusAttributes {
  id: string;
  projectId: string;
  name: string;
  position: number;
  isDefault: boolean;
  mappedStatus?: "TODO" | "IN_PROGRESS" | "DONE" | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type StatusCreationAttributes = Optional<
  StatusAttributes,
  "id" | "isDefault" | "mappedStatus"
>;
export class Status
  extends Model<StatusAttributes, StatusCreationAttributes>
  implements StatusAttributes
{
  declare public id: string;
  declare public projectId: string;
  declare public name: string;
  declare public position: number;
  declare public isDefault: boolean;
  declare public mappedStatus?: "TODO" | "IN_PROGRESS" | "DONE" | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof Status => {
  Status.init(
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
        validate: { notEmpty: { msg: "Status name is required" } },
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
        type: DataTypes.ENUM("TODO", "IN_PROGRESS", "DONE"),
        allowNull: true,
        field: "mapped_status",
        validate: {
          isIn: {
            args: [["TODO", "IN_PROGRESS", "DONE", null]],
            msg: "Invalid mapped status",
          },
        },
      },
    },
    {
      sequelize,
      tableName: "statuses",
      timestamps: true,
      underscored: true,
    },
  );

  return Status;
};
