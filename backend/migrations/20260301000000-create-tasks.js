"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tasks", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "projects",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("todo", "in_progress", "in_review", "done"),
        allowNull: false,
        defaultValue: "todo",
      },
      priority: {
        type: Sequelize.ENUM("high", "medium", "low"),
        allowNull: false,
        defaultValue: "medium",
      },
      estimated_time: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    await queryInterface.addIndex("tasks", ["project_id"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tasks");
  },
};
