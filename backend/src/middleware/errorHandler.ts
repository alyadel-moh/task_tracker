import { Response } from "express";
import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} from "sequelize";

export function errorHandler(err: any, res: Response): void {
  console.error(err);

  if (
    err instanceof ValidationError ||
    err.name === "SequelizeValidationError"
  ) {
    res.status(400).json({
      error: "Bad Request",
      message: err.errors
        ? err.errors.map((e: any) => e.message)
        : [err.message],
    });
    return;
  }

  if (
    err instanceof UniqueConstraintError ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    res.status(409).json({
      error: "Conflict",
      message: err.errors
        ? err.errors.map((e: any) => e.message)
        : [err.message],
    });
    return;
  }

  if (
    err instanceof ForeignKeyConstraintError ||
    err.name === "SequelizeForeignKeyConstraintError"
  ) {
    res.status(400).json({
      error: "Bad Request",
      message: "Referenced record does not exist or is constrained",
    });
    return;
  }

  res.status(err.status || 500).json({
    error: err.name || "Internal Server Error",
    message: err.message || "An unexpected error occurred",
  });
}

export default errorHandler;
