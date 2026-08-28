import { QueryInterface, DataTypes } from "sequelize";

export = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addColumn("users", "photo_url", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeColumn("users", "photo_url");
  },
};
