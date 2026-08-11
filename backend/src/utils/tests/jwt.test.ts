import { describe, it, expect, vi } from "vitest";
import { generateToken, verifyToken } from "../jwt";
import jwt from "jsonwebtoken";

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mocked.jwt.token"),
    verify: vi.fn().mockReturnValue({ id: "u1", email: "aly@example.com" }),
  },
}));

describe("JWT Utility", () => {
  it("generates a signed JWT token", () => {
    const token = generateToken({ id: "u1", email: "aly@example.com" });
    expect(token).toBe("mocked.jwt.token");
    expect(jwt.sign).toHaveBeenCalled();
  });

  it("verifies and decodes a JWT token", () => {
    const decoded = verifyToken("mocked.jwt.token");
    expect(decoded).toEqual({ id: "u1", email: "aly@example.com" });
    expect(jwt.verify).toHaveBeenCalledWith("mocked.jwt.token", expect.any(String));
  });
});