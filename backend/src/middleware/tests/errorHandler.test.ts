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

  it("covers lines 22-24: handles errors missing status, name, and message fallbacks", () => {
    const emptyErr: any = {};

    errorHandler(emptyErr, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
    );

    const emptyStringsErr: any = { name: "", message: "" };
    errorHandler(emptyStringsErr, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
    );
  });

  it("handles Sequelize ValidationError correctly with standard errors array", () => {
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

  it("handles ValidationError branch permutations (falsy errors and fallback message)", () => {
    const errInstanceNullErrors = new ValidationError("Null errors list", []);
    (errInstanceNullErrors as any).errors = undefined;

    errorHandler(errInstanceNullErrors, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Bad Request",
        message: ["Null errors list"],
      }),
    );

    const errPlainNoErrors: any = {
      name: "SequelizeValidationError",
      message: "Direct message fallback",
    };
    errorHandler(errPlainNoErrors, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Bad Request",
        message: ["Direct message fallback"],
      }),
    );

    const errItemFalsyMsg = new ValidationError("Validation error", [
      { message: "" } as any,
    ]);
    errorHandler(errItemFalsyMsg, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
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

  it("handles a plain object with SequelizeUniqueConstraintError name (no errors array)", () => {
    const err: any = {
      name: "SequelizeUniqueConstraintError",
      message: "Duplicate entry",
    };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Conflict",
        message: ["Duplicate entry"],
      }),
    );
  });

  it("handles a plain object with SequelizeUniqueConstraintError name (with errors array)", () => {
    const err: any = {
      name: "SequelizeUniqueConstraintError",
      message: "Duplicate entry",
      errors: [{ message: "Email must be unique" }],
    };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Conflict",
        message: ["Email must be unique"],
      }),
    );
  });

  it("handles a plain object with SequelizeUniqueConstraintError where item has no message", () => {
    const err: any = {
      name: "SequelizeUniqueConstraintError",
      message: "Fallback duplicate message",
      errors: [{}],
    };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Conflict",
      }),
    );
  });

  it("covers line 32: handles Sequelize ForeignKeyConstraintError correctly with and without custom message", () => {
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

    const plainFkErr: any = {
      name: "SequelizeForeignKeyConstraintError",
      message: "Specific FK failure message",
      table: "users",
    };

    errorHandler(plainFkErr, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("defaults to status 500 when status is undefined", () => {
    const err: any = new Error("Generic failure");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Error",
        message: "Generic failure",
      }),
    );
  });

  it("uses statusCode if status is not provided", () => {
    const err: any = new Error("Not authorized");
    err.statusCode = 401;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
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

  it("passes through non-500 custom error message in production mode", () => {
    process.env.NODE_ENV = "production";
    const err: any = new Error("Client provided invalid credentials");
    err.status = 400;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Client provided invalid credentials",
      }),
    );
  });
});
