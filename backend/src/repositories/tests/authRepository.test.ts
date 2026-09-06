import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRepository } from "../authRepository";
import { User } from "../../models";

vi.mock("../../models", () => ({
  User: {
    create: vi.fn(),
    scope: vi.fn(),
    findByPk: vi.fn(),
    findOne: vi.fn(),
  },
}));

describe("AuthRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a user", async () => {
    const data = {
      name: "Aly",
      email: "aly@example.com",
      password: "hash",
      isEmailVerified: false,
    };
    vi.mocked(User.create).mockResolvedValue(data as never);
    await expect(AuthRepository.createUser(data)).resolves.toBe(data);
    expect(User.create).toHaveBeenCalledWith(data);
  });

  it("finds a user by email with password scope", async () => {
    const scoped = { findOne: vi.fn().mockResolvedValue({ id: "1" }) };
    vi.mocked(User.scope).mockReturnValue(scoped as never);
    await expect(
      AuthRepository.getUserByEmailAndPass("aly@example.com"),
    ).resolves.toEqual({ id: "1" });
    expect(User.scope).toHaveBeenCalledWith("withPassword");
    expect(scoped.findOne).toHaveBeenCalledWith({
      where: { email: "aly@example.com" },
    });
  });

  it("finds users by id and by public email fields", async () => {
    vi.mocked(User.findByPk).mockResolvedValue({ id: "1" } as never);
    vi.mocked(User.findOne).mockResolvedValue({
      id: "1",
      email: "aly@example.com",
    } as never);
    await expect(AuthRepository.findUserById("1")).resolves.toEqual({
      id: "1",
    });
    await AuthRepository.getUserByEmail("aly@example.com");
    expect(User.findOne).toHaveBeenCalledWith({
      where: { email: "aly@example.com" },
      attributes: ["id", "name", "email", "photoUrl"],
    });
  });
});
