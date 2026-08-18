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
import initTimeEntryModel, { TimeEntry } from "./timeEntry";
import initTaskHistoryModel, { TaskHistory } from "./taskHistory";
import initStatusModel, { Status } from "./status";

initUserModel(sequelize);
initProjectModel(sequelize);
initTaskModel(sequelize);
initTimeEntryModel(sequelize);
initTaskHistoryModel(sequelize);
initStatusModel(sequelize);

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

Task.hasMany(TaskHistory, {
  foreignKey: "taskId",
  as: "historyRecords",
  onDelete: "CASCADE",
});
User.hasMany(TaskHistory, {
  foreignKey: "actorId",
  as: "historyRecords",
});

Project.hasMany(Status, {
  foreignKey: "projectId",
  as: "statuses",
  onDelete: "CASCADE",
});

Status.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
  onDelete: "CASCADE",
});

Task.belongsTo(Status, {
  foreignKey: "statusId",
  as: "status",
});
Status.hasMany(Task, {
  foreignKey: "statusId",
  as: "tasks",
  onDelete: "RESTRICT",
});

TaskHistory.belongsTo(Task, { foreignKey: "taskId", as: "task" });
TaskHistory.belongsTo(User, { foreignKey: "actorId", as: "actor" });

export { User, Project, Task, TimeEntry, TaskHistory, Status };
export default sequelize;
