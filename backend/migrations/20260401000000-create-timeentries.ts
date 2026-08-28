import { QueryInterface, DataTypes } from "sequelize";
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS citext;",
    );
    await queryInterface.createTable("time_entries", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      task_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tasks",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      entry_date: {
        type: DataTypes.DATE,
        allowNull: false,
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
    await queryInterface.addIndex("time_entries", ["task_id", "entry_date"], {
      name: "idx_time_entries_task_date",
    });
  },
  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("time_entries");
  },
};
