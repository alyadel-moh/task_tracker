const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Task = sequelize.define(
    "Task",
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
        type: DataTypes.ENUM("TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"),
        defaultValue: "TODO",
      },
      priority: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH"),
        defaultValue: "MEDIUM",
      },
      dueDate: {
        type: DataTypes.DATE,
        field: "due_date",
        allowNull: true,
      },
      estimatedTime: {
        type: DataTypes.INTEGER,
        field: "estimated_time",
        allowNull: true,
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
    },
    {
      tableName: "tasks",
      timestamps: true,
      underscored: true,
    },
  );

  return Task;
};
