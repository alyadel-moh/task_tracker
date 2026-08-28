import { Sequelize } from "sequelize";
import configObject from "../config/config";

const env = (process.env.NODE_ENV ||
  "development") as keyof typeof configObject;
const config = configObject[env] || configObject.development;

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
import initProjectMembersModel, { ProjectMembers } from "./projectMembers";
import initTaskAssigneeModel, { TaskAssignee } from "./taskAssignee";

initUserModel(sequelize);
initProjectModel(sequelize);
initTaskModel(sequelize);
initTimeEntryModel(sequelize);
initTaskHistoryModel(sequelize);
initStatusModel(sequelize);
initProjectMembersModel(sequelize);
initTaskAssigneeModel(sequelize);

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
  as: "actedHistoryRecords",
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

User.hasMany(ProjectMembers, {
  foreignKey: "userId",
  as: "projectMemberships",
  onDelete: "CASCADE",
});
ProjectMembers.belongsTo(User, { foreignKey: "userId", as: "user" });
Project.hasMany(ProjectMembers, {
  foreignKey: "projectId",
  as: "members",
  onDelete: "CASCADE",
});
ProjectMembers.belongsTo(Project, { foreignKey: "projectId", as: "project" });
User.hasMany(Task, {
  foreignKey: "createdBy",
  as: "createdTasks",
  onDelete: "SET NULL",
});
Task.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
Task.belongsToMany(User, {
  through: TaskAssignee,
  as: "assignees",
  foreignKey: "taskId",
  otherKey: "userId",
});
User.belongsToMany(Task, {
  through: TaskAssignee,
  as: "assignedTasks",
  foreignKey: "userId",
  otherKey: "taskId",
});

Project.hasMany(TaskAssignee, {
  foreignKey: "projectId",
  as: "taskAssignees",
  onDelete: "CASCADE",
});
TaskAssignee.belongsTo(Project, { foreignKey: "projectId", as: "project" });

Task.hasMany(TaskAssignee, {
  foreignKey: "taskId",
  as: "taskAssignments",
  onDelete: "CASCADE",
});
TaskAssignee.belongsTo(Task, { foreignKey: "taskId", as: "task" });

User.hasMany(TaskAssignee, {
  foreignKey: "userId",
  as: "userAssignments",
  onDelete: "CASCADE",
});
TaskAssignee.belongsTo(User, { foreignKey: "userId", as: "user" });
export {
  User,
  Project,
  Task,
  TimeEntry,
  TaskHistory,
  Status,
  ProjectMembers,
  TaskAssignee,
};
export default sequelize;
