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
import errorHandler from "./middleware/errorHandler";
import { sequelize } from "./models";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { httpLogger } from "./middleware/httpLogger";

const app: Application = express();

app.use(express.json());
app.use(httpLogger); // Place httpLogger at the very top of request pipeline
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors());

app.use("/api/auth", authRoutes); // use auth routes
app.use("/api/projects", projectRoutes); // use project routes
app.use("/api/tasks", taskRoutes); // use task routes
app.use("/api/time-entries", timeEntryRoutes); // use time entry routes
app.use("/api/task_history", historyRoutes); // use history routes
app.use("/api/projects/statuses", statusRoutes); // use status routes

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

startServer();

export default app;
