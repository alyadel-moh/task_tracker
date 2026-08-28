import { QueryInterface, DataTypes, Sequelize } from "sequelize";
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable("tasks", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "projects",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      status_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "statuses",
          key: "id",
        },
        onDelete: "RESTRICT", // Prevents deleting a status if tasks exist in it
        onUpdate: "CASCADE",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      priority: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH"),
        defaultValue: "MEDIUM",
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      estimated_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
    await queryInterface.addIndex("tasks", ["project_id", "status_id"], {
      name: "idx_tasks_project_status",
    });
    await queryInterface.addIndex("tasks", ["project_id", "due_date"], {
      name: "idx_tasks_project_due_date",
    });
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("tasks");
    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_tasks_priority";',
      );
    }
  },
};
