import cron from "node-cron";
import { Op } from "sequelize";
import { Task, User, Status } from "../models";
import { EmailService } from "../utils/emailService";

export const runTaskReminderJob = async (isTestMode = false) => {
  try {
    console.log("🔔 [Task Reminder] Running due date check...");

    const now = new Date();
    const startOfTomorrow = new Date(now);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(startOfTomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const dateFilter = isTestMode
      ? { [Op.ne]: null }
      : { [Op.gte]: startOfTomorrow, [Op.lte]: endOfTomorrow };

    const tasksDue = await Task.findAll({
      where: {
        dueDate: dateFilter,
        [Op.or]: [
          { "$status.name$": { [Op.notILike]: "%done%" } },
          { "$status.name$": { [Op.is]: null } },
        ],
      },
      include: [
        {
          model: Status,
          as: "status",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "assignees",
          attributes: ["id", "name", "email"],
          through: { attributes: [] },
          required: true,
        },
      ],
    });

    console.log(`📋 Found ${tasksDue.length} tasks matching criteria.`);

    for (const task of tasksDue) {
      if (!task.assignees || task.assignees.length === 0) continue;

      const formattedDueDate = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })
        : "Tomorrow";

      for (const assignee of task.assignees) {
        if (!assignee.email) continue;

        console.log(
          `✉️ Sending reminder for "${task.name}" to ${assignee.email}`,
        );

        await EmailService.sendTaskReminder(
          assignee.email,
          assignee.name,
          task.name,
          formattedDueDate,
        );
      }
    }

    console.log("✅ [Task Reminder] Job completed successfully.");
  } catch (error) {
    console.error("❌ Error running task reminder job:", error);
  }
};

export const initTaskReminderCron = () => {
  cron.schedule("0 9 * * *", () => runTaskReminderJob(false));
};
