import { QueryInterface, DataTypes } from "sequelize";
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS citext;",
    );
    await queryInterface.createTable("history_records", {
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
      actor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
      },

      event_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      field_changed: {
        type: DataTypes.STRING,
        allowNull: true, // created events
      },
      old_value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      new_value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
    await queryInterface.addIndex("history_records", ["task_id"]);
  },
  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("history_records");
  },
};
