import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import timeEntryRoutes from "./routes/timeEntryRoutes";
import historyRoutes from "./routes/historyRoutes";
import statusRoutes from "./routes/statusRoutes";
import projectMembersRoutes from "./routes/projectMembersRoutes";
import errorHandler from "./middleware/errorHandler";
import { sequelize } from "./models";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { httpLogger } from "./middleware/httpLogger";
import { initTaskReminderCron } from "./jobs/taskReminderJob";

const app: Application = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(httpLogger);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/time-entries", timeEntryRoutes);
app.use("/api/task_history", historyRoutes);
app.use("/api/projects", statusRoutes);
app.use("/api/projects", projectMembersRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");
    initTaskReminderCron();
    console.log("Task reminder cron job initialized.");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

startServer();

export default app;
