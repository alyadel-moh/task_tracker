import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env relative to this file's directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface DBConfig {
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  port?: number;
  dialect: "postgres";
  logging?: boolean | ((sql: string) => void);
}

interface Config {
  development: DBConfig;
  test?: DBConfig;
  production?: DBConfig;
  [key: string]: DBConfig | undefined;
}

const config: Config = {
  development: {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "task_tracker",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  },
};

export default config;
