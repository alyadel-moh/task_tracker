import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { errorHandler } from "../errorHandler";
import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} from "sequelize";

vi.mock("../../config/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("ErrorHandler Middleware", () => {
  let req: any;
  let res: any;
  let next: any;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { path: "/api/test", method: "GET" };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("handles standard custom errors correctly", () => {
    const err: any = new Error("Custom error message");
    err.status = 400;
    err.name = "BadRequest";

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "BadRequest",
        message: "Custom error message",
      }),
    );
  });

  it("handles Sequelize ValidationError correctly", () => {
    const err = new ValidationError("Validation error", [
      { message: "Field is required" } as any,
    ]);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Bad Request",
        message: ["Field is required"],
      }),
    );
  });

  it("handles Sequelize UniqueConstraintError correctly", () => {
    const err = new UniqueConstraintError({
      message: "Duplicate entry",
      errors: [{ message: "Email must be unique" } as any],
    });

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Bad Request",
        message: ["Email must be unique"],
      }),
    );
  });

  it("handles Sequelize ForeignKeyConstraintError correctly", () => {
    const err = new ForeignKeyConstraintError({
      message: "Foreign key constraint failed",
    });

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Bad Request",
        message: "Referenced record does not exist or is constrained",
      }),
    );
  });

  it("sanitizes 500 errors in production mode", () => {
    process.env.NODE_ENV = "production";
    const err: any = new Error("Database password leaked");
    err.status = 500;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal Server Error",
      message: "An unexpected error occurred on the server.",
    });
  });
});
