import { describe, it, expect, vi } from "vitest";
import { httpLogger, stream } from "../httpLogger";
import { logger } from "../../config/logger";

vi.mock("../../config/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("HTTP Logger Middleware", () => {
  it("is defined and functions as an express middleware", () => {
    expect(httpLogger).toBeDefined();
    expect(typeof httpLogger).toBe("function");
  });

  it("writes morgan logs into winston logger via stream.write", () => {
    expect(stream.write).toBeDefined();

    // Invoke the stream write function directly to ensure 100% function coverage
    stream.write("GET /api/tasks 200 - 15.2 ms");

    expect(logger.info).toHaveBeenCalledWith("GET /api/tasks 200 - 15.2 ms");
  });
});
