import path from "path";
import dotenv from "dotenv";

// Resolves .env relative to current working directory (project root)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const dbConfig = {
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "task_tracker",
  host: process.env.DB_HOST || "postgres",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  dialect: "postgres" as const,
  logging: false,
};

const config = {
  development: {
    ...dbConfig,
    logging: console.log,
  },
  test: {
    ...dbConfig,
    database: process.env.DB_NAME || "task_tracker_test",
  },
  production: dbConfig,
};

export = config;
