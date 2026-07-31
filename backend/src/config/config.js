const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  },
};
