import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import timeEntryRoutes from "./routes/timeEntryRoutes";
import errorHandler from "./middleware/errorHandler";
import { sequelize } from "./models";

const app: Application = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes); // use auth routes
app.use("/api/projects", projectRoutes); // use project routes
app.use("/api/tasks", taskRoutes); // use task routes
app.use("/api/time-entries", timeEntryRoutes); // use time entry routes

// Error handling middleware
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
