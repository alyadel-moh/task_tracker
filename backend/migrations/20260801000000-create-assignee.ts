import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable("task_assignees", {
      task_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "tasks",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "projects",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    });

    await queryInterface.addIndex("task_assignees", ["task_id"], {
      name: "task_assignees_task_id_idx",
    });

    await queryInterface.addIndex("task_assignees", ["user_id"], {
      name: "task_assignees_user_id_idx",
    });

    await queryInterface.addIndex("task_assignees", ["project_id"], {
      name: "task_assignees_project_id_idx",
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("task_assignees");
  },
};
