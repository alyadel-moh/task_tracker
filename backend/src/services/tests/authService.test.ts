import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "../authService";
import { AuthRepository } from "../../repositories/authRepository";
import { EmailService } from "../../utils/emailService";
import { generateToken } from "../../utils/jwt";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

vi.mock("../../repositories/authRepository", () => ({
  AuthRepository: {
    getUserByEmail: vi.fn(),
    getUserByEmailAndPass: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
  },
}));
vi.mock("../../utils/emailService", () => ({
  EmailService: {
    sendVerificationCode: vi.fn(),
    sendPasswordResetOtp: vi.fn(),
  },
}));
vi.mock("../../utils/jwt", () => ({ generateToken: vi.fn() }));
vi.mock("bcryptjs", () => ({
  default: { genSalt: vi.fn(), hash: vi.fn(), compare: vi.fn() },
}));
vi.mock("jsonwebtoken", () => ({
  default: { sign: vi.fn(), verify: vi.fn() },
}));

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bcrypt.genSalt).mockResolvedValue("salt" as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("hash" as never);
    vi.mocked(jwt.sign).mockReturnValue("token" as never);
  });

  it("validates registration and login input", async () => {
    await expect(
      AuthService.register({ name: "", email: "", password: "" }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      AuthService.register({ name: "A", email: "a@x.com", password: "short" }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(AuthService.login("", "")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("registers a pending user, rejects duplicates, and delegates to resendOtp", async () => {
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue(null);
    await expect(
      AuthService.register({
        name: " Aly ",
        email: " aly@example.com ",
        password: "password",
      }),
    ).resolves.toMatchObject({ email: "aly@example.com", token: "token" });
    expect(EmailService.sendVerificationCode).toHaveBeenCalled();

    // Calls resendOtp (delegates to register)
    await expect(
      AuthService.resendOtp({
        name: " Aly ",
        email: " aly@example.com ",
        password: "password",
      }),
    ).resolves.toMatchObject({ email: "aly@example.com", token: "token" });

    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue({
      id: "u1",
    } as never);
    await expect(
      AuthService.register({
        name: "Aly",
        email: "aly@example.com",
        password: "password",
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("verifies OTP and handles invalid verification", async () => {
    await expect(
      AuthService.verifyOtp({ email: "a@x.com", otp: "", token: "" }),
    ).rejects.toMatchObject({ status: 400 });
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("expired");
    });
    await expect(
      AuthService.verifyOtp({ email: "a@x.com", otp: "123456", token: "bad" }),
    ).rejects.toMatchObject({ status: 400 });
    vi.mocked(jwt.verify).mockReturnValue({
      otpHash: "hash",
      name: "Aly",
      email: "a@x.com",
      password: "hash",
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(
      AuthService.verifyOtp({
        email: "a@x.com",
        otp: "123456",
        token: "token",
      }),
    ).rejects.toMatchObject({ status: 400 });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue(null);
    await expect(
      AuthService.verifyOtp({
        email: "a@x.com",
        otp: "123456",
        token: "token",
      }),
    ).resolves.toMatchObject({ message: expect.stringContaining("created") });
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue({
      id: "u1",
    } as never);
    await expect(
      AuthService.verifyOtp({
        email: "a@x.com",
        otp: "123456",
        token: "token",
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("logs in users according to password and verification state", async () => {
    vi.mocked(AuthRepository.getUserByEmailAndPass).mockResolvedValue(null);
    await expect(
      AuthService.login("a@x.com", "password"),
    ).rejects.toMatchObject({ status: 401 });
    const user = {
      id: "u1",
      email: "a@x.com",
      validPassword: vi.fn().mockResolvedValue(false),
      isEmailVerified: true,
    };
    vi.mocked(AuthRepository.getUserByEmailAndPass).mockResolvedValue(
      user as never,
    );
    await expect(
      AuthService.login("a@x.com", "password"),
    ).rejects.toMatchObject({ status: 401 });
    user.validPassword.mockResolvedValue(true);
    user.isEmailVerified = false;
    await expect(
      AuthService.login("a@x.com", "password"),
    ).rejects.toMatchObject({ status: 403 });
    user.isEmailVerified = true;
    vi.mocked(generateToken).mockReturnValue("jwt" as never);
    await expect(AuthService.login(" a@x.com ", "password")).resolves.toBe(
      "jwt",
    );
  });

  it("updates profiles, verifies changed email, and handles unchanged email (Line 179)", async () => {
    const user: any = {
      id: "u1",
      name: "Old",
      email: "old@x.com",
      photoUrl: null,
      save: vi.fn(),
    };
    vi.mocked(AuthRepository.findUserById).mockResolvedValue(user);

    // Update name and photo
    await expect(
      AuthService.update("u1", { name: " New ", photoUrl: "pic" }),
    ).resolves.toMatchObject({ changedLabel: "Photo URL" });

    // Empty name rejected
    await expect(AuthService.update("u1", { name: " " })).rejects.toMatchObject(
      { status: 400 },
    );

    // Covers line 179: user provides their same email (user.email === trimmedEmail -> false branch)
    const sameEmailRes = await AuthService.update("u1", {
      email: "  old@x.com  ",
    });
    expect(sameEmailRes.requiresEmailVerification).toBeUndefined();

    // Duplicate email check
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue({
      id: "u2",
    } as never);
    await expect(
      AuthService.update("u1", { email: "other@x.com" }),
    ).rejects.toMatchObject({ status: 400 });

    // Success email update triggers verification code
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue(null);
    await expect(
      AuthService.update("u1", { email: "new@x.com" }),
    ).resolves.toMatchObject({ requiresEmailVerification: true });

    // verifyUpdatedEmailOtp flows
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "u1",
      newEmail: "new@x.com",
      otpHash: "hash",
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    await expect(
      AuthService.verifyUpdatedEmailOtp({
        userId: "u1",
        newEmail: "new@x.com",
        otp: "123456",
        token: "token",
      }),
    ).resolves.toMatchObject({ message: expect.stringContaining("updated") });

    await expect(
      AuthService.verifyUpdatedEmailOtp({
        userId: "",
        newEmail: "",
        otp: "",
        token: "",
      }),
    ).rejects.toMatchObject({ status: 400 });

    // Verification code expired/invalid
    vi.mocked(jwt.verify).mockImplementationOnce(() => {
      throw new Error("token expired");
    });
    await expect(
      AuthService.verifyUpdatedEmailOtp({
        userId: "u1",
        newEmail: "new@x.com",
        otp: "123456",
        token: "expired_token",
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Verification code expired or invalid",
    });

    // Token mismatch
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "u2",
      newEmail: "other@x.com",
      otpHash: "hash",
    } as never);
    await expect(
      AuthService.verifyUpdatedEmailOtp({
        userId: "u1",
        newEmail: "new@x.com",
        otp: "123456",
        token: "token",
      }),
    ).rejects.toMatchObject({ status: 400 });

    // Incorrect OTP
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "u1",
      newEmail: "new@x.com",
      otpHash: "hash",
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(
      AuthService.verifyUpdatedEmailOtp({
        userId: "u1",
        newEmail: "new@x.com",
        otp: "123456",
        token: "token",
      }),
    ).rejects.toMatchObject({ status: 400 });

    // User missing on email verify
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(AuthRepository.findUserById).mockResolvedValue(null);
    await expect(
      AuthService.verifyUpdatedEmailOtp({
        userId: "u1",
        newEmail: "new@x.com",
        otp: "123456",
        token: "token",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("handles reset, forgot-password, and user lookup", async () => {
    vi.mocked(AuthRepository.findUserById).mockResolvedValue(null);
    await expect(AuthService.getUserById("u1")).rejects.toMatchObject({
      status: 404,
    });

    const user: any = {
      id: "u1",
      name: "Aly",
      email: "a@x.com",
      password: "old",
      save: vi.fn(),
    };

    vi.mocked(AuthRepository.findUserById).mockResolvedValue(user);
    await expect(AuthService.getUserById("u1")).resolves.toEqual(user);

    await expect(
      AuthService.ResetPassword("a@x.com", "token", "short", "1"),
    ).rejects.toMatchObject({ status: 400 });

    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue(null);
    await expect(
      AuthService.ResetPassword(
        "notfound@x.com",
        "token",
        "password123",
        "123456",
      ),
    ).rejects.toMatchObject({
      status: 400,
      message: "Invalid or expired reset session.",
    });

    await expect(AuthService.forgotPassword("missing@x.com")).resolves.toEqual({
      message: "a reset code has been sent.",
    });

    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue(user);
    vi.mocked(AuthRepository.findUserById).mockResolvedValue(null);
    await expect(
      AuthService.update("u1", { name: "New" }),
    ).rejects.toMatchObject({ status: 404 });

    vi.mocked(AuthRepository.findUserById).mockResolvedValue(user);
    await expect(
      AuthService.update("u1", { email: " " }),
    ).rejects.toMatchObject({ status: 400 });

    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("bad");
    });
    await expect(
      AuthService.ResetPassword("a@x.com", "bad", "password", "1"),
    ).rejects.toMatchObject({ status: 400 });

    vi.mocked(jwt.verify).mockReturnValue({
      email: "wrong",
      otp: "1",
    } as never);
    await expect(
      AuthService.ResetPassword("a@x.com", "token", "password", "1"),
    ).rejects.toMatchObject({ status: 400 });

    vi.mocked(jwt.verify).mockReturnValue({
      email: "a@x.com",
      otp: "1",
    } as never);
    await expect(
      AuthService.ResetPassword("a@x.com", "token", "password", "1"),
    ).resolves.toMatchObject({ message: expect.stringContaining("reset") });

    await expect(AuthService.forgotPassword("a@x.com")).resolves.toMatchObject({
      message: "Reset code sent successfully",
    });
  });
});
