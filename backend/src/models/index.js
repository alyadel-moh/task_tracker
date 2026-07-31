const { Sequelize } = require("sequelize");
const config = require("../config/config").development;

// Instantiate database connection
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);
const User = require("./user")(sequelize);
const Project = require("./project")(sequelize);
User.hasMany(Project, { foreignKey: "userId", as: "projects" });
Project.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = {
  sequelize,
  User,
  Project,
};
// add relation ships between users and tasks , projects
