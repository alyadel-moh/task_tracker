import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticate } from "../../middleware/auth";
import { verifyToken } from "../../utils/jwt";
import { User } from "../../models";

vi.mock("../../utils/jwt", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("../../models", () => ({
  User: {
    findByPk: vi.fn(),
  },
}));

describe("Authenticate Middleware", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it("returns 401 if authorization header is missing", async () => {
    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      message: "No token provided",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 if authorization header does not start with Bearer", async () => {
    req.headers.authorization = "Basic 12345";
    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      message: "No token provided",
    });
  });

  it("returns 401 if user is not found in database", async () => {
    req.headers.authorization = "Bearer valid.jwt.token";
    vi.mocked(verifyToken).mockReturnValue({ id: 123 } as never);
    vi.mocked(User.findByPk).mockResolvedValue(null as never);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      message: "User not found",
    });
  });

  it("returns 401 if token verification throws an error", async () => {
    req.headers.authorization = "Bearer invalid.jwt.token";
    vi.mocked(verifyToken).mockImplementation(() => {
      throw new Error("Expired token");
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  });

  it("attaches user to req and calls next() on successful authentication", async () => {
    req.headers.authorization = "Bearer valid.jwt.token";
    const mockUser = {
      id: 123,
      name: "Aly",
      getDataValue: (field: string) => mockUser[field as keyof typeof mockUser],
    };
    vi.mocked(verifyToken).mockReturnValue({ id: 123 } as never);
    vi.mocked(User.findByPk).mockResolvedValue(mockUser as never);

    await authenticate(req, res, next);

    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
