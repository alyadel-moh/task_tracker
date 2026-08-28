import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable("project_members", {
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
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      role: {
        type: DataTypes.ENUM("OWNER", "MEMBER"),
        allowNull: false,
        defaultValue: "MEMBER",
      },
      membership_status: {
        type: DataTypes.ENUM("ACTIVE", "PENDING"),
        allowNull: false,
        defaultValue: "PENDING",
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

    await queryInterface.addIndex(
      "project_members",
      ["project_id", "membership_status"],
      {
        name: "idx_project_members_project_status",
      },
    );

    await queryInterface.addIndex(
      "project_members",
      ["user_id", "membership_status"],
      {
        name: "idx_project_members_user_status",
      },
    );

    await queryInterface.addConstraint("project_members", {
      fields: ["project_id", "user_id"],
      type: "unique",
      name: "unique_project_user_membership",
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    try {
      await queryInterface.removeConstraint(
        "project_members",
        "unique_project_user_membership",
      );
    } catch {}

    await queryInterface.dropTable("project_members");

    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_project_members_role";',
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_project_members_membership_status";',
      );
    }
  },
};
