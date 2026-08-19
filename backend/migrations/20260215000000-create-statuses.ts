import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        "statuses",
        {
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
          position: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          is_default: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
        },
        { transaction },
      );

      await queryInterface.addConstraint("statuses", {
        fields: ["project_id", "position"],
        type: "unique",
        name: "unique_project_position",
        transaction,
      });
      await queryInterface.addConstraint("statuses", {
        fields: ["project_id", "name"],
        type: "unique",
        name: "unique_project_status_name",
        transaction,
      });

      const [projects] = (await queryInterface.sequelize.query(
        `SELECT id FROM "projects";`,
        { transaction },
      )) as [Array<{ id: string }>, unknown];

      const defaultStatuses = [
        { name: "TODO", position: 0, isDefault: true },
        { name: "IN_PROGRESS", position: 1, isDefault: true },
        { name: "DONE", position: 2, isDefault: true },
      ];

      for (const project of projects) {
        for (const status of defaultStatuses) {
          await queryInterface.sequelize.query(
            `INSERT INTO "statuses" ("id", "project_id", "name", "position", "is_default", "created_at", "updated_at")
             VALUES (gen_random_uuid(), ?, ?, ?, ?, NOW(), NOW());`,
            {
              replacements: [
                project.id,
                status.name,
                status.position,
                status.isDefault,
              ],
              transaction,
            },
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("statuses", { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
