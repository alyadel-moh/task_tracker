import { QueryInterface, DataTypes } from "sequelize";
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"),
        defaultValue: "TODO",
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
    await queryInterface.addIndex("tasks", ["project_id"]);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("tasks");
  },
};
