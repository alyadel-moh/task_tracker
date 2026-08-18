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

      await queryInterface.addColumn(
        "tasks",
        "status_id",
        {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "statuses",
            key: "id",
          },
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
        },
        { transaction },
      );

      const [projects] = (await queryInterface.sequelize.query(
        `SELECT id FROM "projects";`,
        { transaction },
      )) as [Array<{ id: string }>, unknown];

      const defaultStatuses = [
        { name: "TODO", position: 0, isDefault: true, mappedStatus: "TODO" },
        {
          name: "IN_PROGRESS",
          position: 1,
          isDefault: true,
          mappedStatus: "IN_PROGRESS",
        },
        { name: "DONE", position: 2, isDefault: true, mappedStatus: "DONE" },
      ];

      for (const project of projects) {
        for (const status of defaultStatuses) {
          const [inserted] = (await queryInterface.sequelize.query(
            `INSERT INTO "statuses" ("id", "project_id", "name", "position", "isDefault", "mappedStatus", "created_at", "updated_at")
             VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, NOW(), NOW())
             RETURNING "id";`,
            {
              replacements: [
                project.id,
                status.name,
                status.position,
                status.isDefault,
                status.mappedStatus,
              ],
              transaction,
            },
          )) as [Array<{ id: string }>, unknown];

          const statusId = inserted[0].id;

          await queryInterface.sequelize.query(
            `UPDATE "tasks" SET "status_id" = ? WHERE "project_id" = ? AND "status" = ?;`,
            {
              replacements: [statusId, project.id, status.mappedStatus],
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
      await queryInterface.removeColumn("tasks", "status_id", { transaction });
      await queryInterface.dropTable("statuses", { transaction });
      if (queryInterface.sequelize.getDialect() === "postgres") {
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_statuses_mappedStatus";',
          { transaction },
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
