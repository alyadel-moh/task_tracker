import { beforeEach, describe, expect, it, vi } from "vitest";
import * as controller from "../authController";
import { AuthService } from "../../services/authService";

vi.mock("../../services/authService", () => ({
  AuthService: {
    register: vi.fn(),
    verifyOtp: vi.fn(),
    resendOtp: vi.fn(),
    login: vi.fn(),
    update: vi.fn(),
    verifyUpdatedEmailOtp: vi.fn(),
    getUserById: vi.fn(),
    forgotPassword: vi.fn(),
    ResetPassword: vi.fn(),
  },
}));

const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
const request = () => ({ body: {}, user: { id: "u1" } });

describe("authController", () => {
  beforeEach(() => vi.clearAllMocks());

  it("forwards successful auth operations and shapes responses", async () => {
    const req: any = request();
    const res: any = response();
    const next = vi.fn();
    vi.mocked(AuthService.register).mockResolvedValue({ token: "t" } as never);
    await controller.register(req, res, next);
    vi.mocked(AuthService.verifyOtp).mockResolvedValue({ ok: true } as never);
    await controller.verifyOtp(req, res, next);
    vi.mocked(AuthService.resendOtp).mockResolvedValue({ ok: true } as never);
    await controller.resendVerificationEmail(req, res, next);
    vi.mocked(AuthService.login).mockResolvedValue("jwt" as never);
    req.body = { email: "a@x.com", password: "password" };
    await controller.login(req, res, next);
    vi.mocked(AuthService.update).mockResolvedValue({
      changedLabel: "Name",
      updatedField: { name: "A" },
      requiresEmailVerification: true,
      emailVerificationToken: "t",
      pendingEmail: "b@x.com",
    } as never);
    await controller.update(req, res, next);
    vi.mocked(AuthService.update).mockResolvedValue({
      changedLabel: "",
      updatedField: {},
    } as never);
    await controller.update(req, res, next);
    vi.mocked(AuthService.verifyUpdatedEmailOtp).mockResolvedValue({
      ok: true,
    } as never);
    await controller.verifyUpdatedEmailOtp(req, res, next);
    vi.mocked(AuthService.getUserById).mockResolvedValue({ id: "u1" } as never);
    req.user = { id: "u1" };
    await controller.me(req, res, next);
    await controller.logout(req, res);
    req.user = undefined;
    await controller.me(req, res, next);
    vi.mocked(AuthService.forgotPassword).mockResolvedValue({
      ok: true,
    } as never);
    req.body = { email: "a@x.com" };
    await controller.forgotPassword(req, res, next);
    vi.mocked(AuthService.ResetPassword).mockResolvedValue({
      ok: true,
    } as never);
    req.body = {
      email: "a@x.com",
      otp: "1",
      newPassword: "password",
      resetToken: "t",
    };
    await controller.resetPassword(req, res, next);
    await controller.forgotPassword({ ...req, body: {} }, res, next);
    await controller.resetPassword({ ...req, body: {} }, res, next);
    expect(AuthService.login).toHaveBeenCalledWith("a@x.com", "password");
    expect(res.status).toHaveBeenCalled();
  });

  it("maps typed and unexpected service errors", async () => {
    const req: any = request();
    const res: any = response();
    const next = vi.fn();
    const cases: Array<[any, () => Promise<unknown>]> = [
      [AuthService.register, () => controller.register(req, res, next)],
      [AuthService.verifyOtp, () => controller.verifyOtp(req, res, next)],
      [
        AuthService.resendOtp,
        () => controller.resendVerificationEmail(req, res, next),
      ],
      [AuthService.login, () => controller.login(req, res, next)],
      [AuthService.update, () => controller.update(req, res, next)],
      [
        AuthService.verifyUpdatedEmailOtp,
        () => controller.verifyUpdatedEmailOtp(req, res, next),
      ],
      [
        AuthService.getUserById,
        () => controller.me({ ...req, user: { id: "u1" } }, res, next),
      ],
      [
        AuthService.forgotPassword,
        () =>
          controller.forgotPassword(
            { ...req, body: { email: "a@x.com" } },
            res,
            next,
          ),
      ],
      [
        AuthService.ResetPassword,
        () =>
          controller.resetPassword(
            {
              ...req,
              body: {
                email: "a",
                otp: "1",
                newPassword: "password",
                resetToken: "t",
              },
            },
            res,
            next,
          ),
      ],
    ];
    for (const [method, invoke] of cases) {
      vi.mocked(method).mockRejectedValueOnce({ status: 400, message: "bad" });
      await invoke();
    }
    for (const [method, invoke] of cases) {
      vi.mocked(method).mockRejectedValueOnce(new Error("boom"));
      await invoke();
    }
    expect(next).toHaveBeenCalled();
  });
});
