import { Response, NextFunction } from "express";
import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} from "sequelize";
import { logger } from "../config/logger";

export interface CustomError extends Error {
  status?: number;
  statusCode?: number;
  errors?: any;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = err.status || err.statusCode || 500;
  let errorType = err.name || "Internal Server Error";
  let message: string | string[] =
    err.message || "An unexpected error occurred";

  if (
    err instanceof ValidationError ||
    err.name === "SequelizeValidationError"
  ) {
    statusCode = 400;
    errorType = "Bad Request";
    message = err.errors
      ? err.errors.map((e: any) => e.message)
      : [err.message];
  } else if (
    err instanceof UniqueConstraintError ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    statusCode = 409;
    errorType = "Conflict";
    message = err.errors
      ? err.errors.map((e: any) => e.message)
      : [err.message];
  } else if (
    err instanceof ForeignKeyConstraintError ||
    err.name === "SequelizeForeignKeyConstraintError"
  ) {
    statusCode = 400;
    errorType = "Bad Request";
    message = "Referenced record does not exist or is constrained";
  }

  logger.error({
    message: Array.isArray(message) ? message.join(", ") : message,
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  const isProduction = process.env.NODE_ENV === "production";

  if (statusCode === 500 && isProduction) {
    errorType = "Internal Server Error";
    message = "An unexpected error occurred on the server.";
  }

  res.status(statusCode).json({
    error: errorType,
    message,
    ...(!isProduction && { stack: err.stack }),
  });
};

export default errorHandler;
