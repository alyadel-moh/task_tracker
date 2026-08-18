import { describe, it, expect, vi, beforeEach } from "vitest";
import { register, login, me, logout } from "../authController";
import { User } from "../../models";
import bcrypt from "bcryptjs";
import * as jwtUtils from "../../utils/jwt";

vi.mock("../../models", () => ({
  User: {
    create: vi.fn(),
    scope: vi.fn(),
  },
}));

vi.mock("bcryptjs");
vi.mock("../../utils/jwt");

describe("Auth Controller", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe("register()", () => {
    it("returns 400 if required fields are missing", async () => {
      req.body = { email: "aly@example.com" };
      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Bad Request",
        message: "Name, email, and password are required",
      });
    });

    it("returns 400 if password is less than 8 characters", async () => {
      req.body = { name: "Aly", email: "aly@example.com", password: "short" };
      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Bad Request",
        message: "Password must be at least 8 characters long",
      });
    });

    it("hashes password and creates user successfully (201)", async () => {
      req.body = {
        name: "Aly",
        email: "aly@example.com",
        password: "password123",
      };
      vi.mocked(bcrypt.genSalt).mockResolvedValue("salt" as never);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashedPassword" as never);
      vi.mocked(User.create).mockResolvedValue({
        id: "user-123",
        ...req.body,
      } as never);

      await register(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", "salt");
      expect(User.create).toHaveBeenCalledWith({
        name: "Aly",
        email: "aly@example.com",
        password: "hashedPassword",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "User registered successfully",
      });
    });
  });

  describe("login()", () => {
    it("returns 400 if email or password missing", async () => {
      req.body = { email: "aly@example.com" };
      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 401 if user not found", async () => {
      req.body = { email: "notfound@example.com", password: "password123" };
      vi.mocked(User.scope).mockReturnValue({
        findOne: vi.fn().mockResolvedValue(null),
      } as any);

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
    });

    it("returns 200 with JWT token on valid credentials", async () => {
      req.body = { email: "aly@example.com", password: "password123" };
      const mockUserInstance = {
        id: "user-123",
        email: "aly@example.com",
        validPassword: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(User.scope).mockReturnValue({
        findOne: vi.fn().mockResolvedValue(mockUserInstance),
      } as any);
      vi.mocked(jwtUtils.generateToken).mockReturnValue("mocked-jwt-token");

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Login successful",
        token: "mocked-jwt-token",
      });
    });
  });

  describe("me() & logout()", () => {
    it("returns user data if req.user is set", async () => {
      req.user = { id: "u1", name: "Aly", email: "aly@example.com" };
      await me(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(req.user);
    });

    it("returns 200 on logout", async () => {
      await logout(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
