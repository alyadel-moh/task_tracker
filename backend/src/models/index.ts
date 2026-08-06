import { Sequelize } from "sequelize";
import configObject from "../config/config";

const config = configObject.development;

export const sequelize = new Sequelize(
  config.database || "",
  config.username || "",
  config.password || "",
  config,
);

import initUserModel, { User } from "./user";
import initProjectModel, { Project } from "./project";
import initTaskModel, { Task } from "./task";
import initTimeEntryModel, { TimeEntry } from "./time_entry";

initUserModel(sequelize);
initProjectModel(sequelize);
initTaskModel(sequelize);
initTimeEntryModel(sequelize);

User.hasMany(Project, {
  foreignKey: "userId",
  as: "projects",
  onDelete: "CASCADE",
});
Project.belongsTo(User, { foreignKey: "userId", as: "user" });

Project.hasMany(Task, {
  foreignKey: "projectId",
  as: "tasks",
  onDelete: "CASCADE",
});
Task.belongsTo(Project, { foreignKey: "projectId", as: "project" });

Task.hasMany(TimeEntry, {
  foreignKey: "taskId",
  as: "timeEntries",
  onDelete: "CASCADE",
});
TimeEntry.belongsTo(Task, { foreignKey: "taskId", as: "task" });

export { User, Project, Task, TimeEntry };
export default sequelize;
