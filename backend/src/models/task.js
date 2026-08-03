const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Task = sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Task name is required" } },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "project_id",
      },
      status: {
        type: DataTypes.ENUM("todo", "in-progress", "in-review", "done"),
        allowNull: false,
        defaultValue: "todo",
      },
      priority: {
        type: DataTypes.ENUM("high", "medium", "low"),
        allowNull: false,
        defaultValue: "medium",
      },
      estimatedTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "estimated_time",
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "due_date",
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
