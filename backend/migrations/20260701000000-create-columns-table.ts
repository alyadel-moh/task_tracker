import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        "columns",
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
          mapped_status: {
            type: DataTypes.ENUM("TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"),
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
        },
        { transaction },
      );

      await queryInterface.addConstraint("columns", {
        fields: ["project_id", "position"],
        type: "unique",
        name: "unique_project_position",
        transaction,
      });

      await queryInterface.addColumn(
        "tasks",
        "column_id",
        {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "columns",
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

      const defaultColumns = [
        { name: "TODO", position: 0, isDefault: true, mappedStatus: "TODO" },
        {
          name: "IN_PROGRESS",
          position: 1,
          isDefault: true,
          mappedStatus: "IN_PROGRESS",
        },
        {
          name: "IN_REVIEW",
          position: 2,
          isDefault: true,
          mappedStatus: "IN_REVIEW",
        },
        { name: "DONE", position: 3, isDefault: true, mappedStatus: "DONE" },
      ];

      for (const project of projects) {
        for (const column of defaultColumns) {
          const [inserted] = (await queryInterface.sequelize.query(
            `INSERT INTO "columns" ("id", "project_id", "name", "position", "isDefault", "mappedStatus", "created_at", "updated_at")
             VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, NOW(), NOW())
             RETURNING "id";`,
            {
              replacements: [
                project.id,
                column.name,
                column.position,
                column.isDefault,
                column.mappedStatus,
              ],
              transaction,
            },
          )) as [Array<{ id: string }>, unknown];

          const columnId = inserted[0].id;

          await queryInterface.sequelize.query(
            `UPDATE "tasks" SET "column_id" = ? WHERE "project_id" = ? AND "status" = ?;`,
            {
              replacements: [columnId, project.id, column.mappedStatus],
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
      await queryInterface.removeColumn("tasks", "column_id", { transaction });
      await queryInterface.dropTable("columns", { transaction });
      if (queryInterface.sequelize.getDialect() === "postgres") {
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_columns_mappedStatus";',
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
