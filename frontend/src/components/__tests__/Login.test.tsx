import { fireEvent, render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import Login from "../Login";
import { toast } from "react-hot-toast";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

let mockLoginPending = false;
let mockForgotPending = false;
let mockResetPending = false;

const mockLoginMutate = vi.fn();
vi.mock("../../hooks/loginHook", () => ({
  default: () => ({
    mutate: mockLoginMutate,
    get isPending() {
      return mockLoginPending;
    },
  }),
}));

const mockForgotPasswordMutate = vi.fn();
const mockResetPasswordMutate = vi.fn();
vi.mock("../../hooks/forgetPasswordHook", () => ({
  useForgotPassword: () => ({
    mutate: mockForgotPasswordMutate,
    get isPending() {
      return mockForgotPending;
    },
  }),
  useResetPassword: () => ({
    mutate: mockResetPasswordMutate,
    get isPending() {
      return mockResetPending;
    },
  }),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Login Component 100% Branch Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginPending = false;
    mockForgotPending = false;
    mockResetPending = false;
  });

  describe("Form Rendering & Password Toggling", () => {
    it("renders heading, input fields, and submit button", () => {
      renderLogin();

      expect(
        screen.getByRole("heading", { name: /welcome back/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("name@example.com"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your password"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Log in" }),
      ).toBeInTheDocument();
    });

    it("displays validation errors for blank and invalid fields", async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByRole("button", { name: "Log in" }));

      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
      expect(
        await screen.findByText(/password is required/i),
      ).toBeInTheDocument();

      await user.type(
        screen.getByPlaceholderText("name@example.com"),
        "invalid-email",
      );
      await user.click(screen.getByRole("button", { name: "Log in" }));

      expect(
        await screen.findByText(/invalid email address/i),
      ).toBeInTheDocument();
      expect(mockLoginMutate).not.toHaveBeenCalled();
    });

    it("toggles login password visibility between text and password types", async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const toggleBtn = screen.getByRole("button", { name: /show password/i });

      expect(passwordInput).toHaveAttribute("type", "password");

      await user.click(toggleBtn);
      expect(passwordInput).toHaveAttribute("type", "text");
      expect(
        screen.getByRole("button", { name: /hide password/i }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /hide password/i }));
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Login Submission", () => {
    it("submits valid credentials and uses default message on success", async () => {
      const user = userEvent.setup();

      mockLoginMutate.mockImplementation((_data, { onSuccess }) => {
        onSuccess({});
      });

      renderLogin();

      await user.type(
        screen.getByPlaceholderText("name@example.com"),
        "aly@example.com",
      );
      await user.type(
        screen.getByPlaceholderText("Enter your password"),
        "Password123!",
      );
      await user.click(screen.getByRole("button", { name: "Log in" }));

      expect(mockLoginMutate).toHaveBeenCalledWith(
        { email: "aly@example.com", password: "Password123!" },
        expect.any(Object),
      );
      expect(toast.success).toHaveBeenCalledWith("Welcome back!");
      expect(mockNavigate).toHaveBeenCalledWith("/projects");
    });

    it("displays fallback error toast when backend response message is missing", async () => {
      const user = userEvent.setup();

      mockLoginMutate.mockImplementation((_data, { onError }) => {
        onError({});
      });

      renderLogin();

      await user.type(
        screen.getByPlaceholderText("name@example.com"),
        "aly@example.com",
      );
      await user.type(
        screen.getByPlaceholderText("Enter your password"),
        "WrongPassword",
      );
      await user.click(screen.getByRole("button", { name: "Log in" }));

      expect(toast.error).toHaveBeenCalledWith("Invalid email or password.");
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("renders loading spinner state when login mutation is pending", () => {
      mockLoginPending = true;
      renderLogin();

      expect(screen.getByText(/logging in\.\.\./i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /logging in\.\.\./i }),
      ).toBeDisabled();
    });
  });

  describe("Forgot Password Flow & Validation (Step 1)", () => {
    it("opens and closes the forgot password modal", async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByText(/forgot password\?/i));
      expect(
        screen.getByRole("heading", { name: "Reset Password" }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /close modal/i }));
      expect(
        screen.queryByRole("heading", { name: "Reset Password" }),
      ).not.toBeInTheDocument();
    });

    it("closes modal on overlay click and stops propagation inside modal card", () => {
      renderLogin();

      fireEvent.click(screen.getByText(/forgot password\?/i));
      expect(screen.getByText("Reset Password")).toBeInTheDocument();

      const modalCard = document.querySelector(".reset-modal-card")!;
      fireEvent.click(modalCard);
      expect(screen.getByText("Reset Password")).toBeInTheDocument();

      const overlay = document.querySelector(".reset-modal-overlay")!;
      fireEvent.click(overlay);
      expect(screen.queryByText("Reset Password")).not.toBeInTheDocument();
    });

    it("validates empty and invalid email in forgot password form", async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByText(/forgot password\?/i));
      const modal = screen
        .getByText("Reset Password")
        .closest(".reset-modal-card") as HTMLElement;
      const submitBtn = within(modal).getByRole("button", {
        name: "Send Reset Code",
      });

      await user.click(submitBtn);
      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();

      const emailInput = within(modal).getByPlaceholderText("name@example.com");
      await user.type(emailInput, "not-an-email");
      await user.click(submitBtn);
      expect(
        await screen.findByText(/invalid email address/i),
      ).toBeInTheDocument();
    });

    it("displays error toast on forgot password request failure with fallback string", async () => {
      const user = userEvent.setup();

      mockForgotPasswordMutate.mockImplementation((_data, { onError }) => {
        onError({});
      });

      renderLogin();

      await user.click(screen.getByText(/forgot password\?/i));
      const modal = screen
        .getByText("Reset Password")
        .closest(".reset-modal-card") as HTMLElement;
      const emailInput = within(modal).getByPlaceholderText("name@example.com");

      await user.type(emailInput, "unknown@example.com");
      await user.click(
        within(modal).getByRole("button", { name: "Send Reset Code" }),
      );

      expect(toast.error).toHaveBeenCalledWith("Failed to send reset code.");
    });

    it("renders sending spinner when forgot password is pending", () => {
      mockForgotPending = true;
      renderLogin();

      fireEvent.click(screen.getByText(/forgot password\?/i));
      expect(screen.getByText(/Sending Code\.\.\./i)).toBeInTheDocument();
    });
  });

  describe("OTP & Step 2 Password Reset", () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      mockForgotPasswordMutate.mockImplementation((_data, { onSuccess }) => {
        onSuccess({
          message: "Reset code sent.",
          resetToken: "test-token-xyz",
        });
      });

      renderLogin();

      await user.click(screen.getByText(/forgot password\?/i));
      const modal = screen
        .getByText("Reset Password")
        .closest(".reset-modal-card") as HTMLElement;
      await user.type(
        within(modal).getByPlaceholderText("name@example.com"),
        "aly@example.com",
      );
      await user.click(
        within(modal).getByRole("button", { name: "Send Reset Code" }),
      );
    });

    it("handles keyboard navigation and backspacing in OTP inputs", () => {
      const otpBoxes = screen
        .getAllByRole("textbox")
        .filter((el) => el.classList.contains("otp-box")) as HTMLInputElement[];

      fireEvent.keyDown(otpBoxes[0], { key: "ArrowRight" });
      fireEvent.keyDown(otpBoxes[1], { key: "ArrowLeft" });

      fireEvent.change(otpBoxes[0], { target: { value: "7" } });
      expect(otpBoxes[0]).toHaveValue("7");

      fireEvent.keyDown(otpBoxes[1], { key: "Backspace" });
      expect(otpBoxes[0]).toHaveFocus();
    });

    it("ignores empty paste events", () => {
      const otpBoxes = screen
        .getAllByRole("textbox")
        .filter((el) => el.classList.contains("otp-box")) as HTMLInputElement[];

      fireEvent.paste(otpBoxes[0], {
        clipboardData: { getData: () => "" },
      });

      expect(otpBoxes[0]).toHaveValue("");
    });

    it("toggles visibility for newPassword and confirmPassword fields", async () => {
      const user = userEvent.setup();

      const newPassInput = screen.getByPlaceholderText("Min 8 characters");
      const confirmPassInput = screen.getByPlaceholderText(
        "Confirm new password",
      );

      const newPassWrapper = newPassInput.closest(
        ".input-with-icon",
      ) as HTMLElement;
      const confirmPassWrapper = confirmPassInput.closest(
        ".input-with-icon",
      ) as HTMLElement;

      const newPassToggle = within(newPassWrapper).getByRole("button", {
        name: /show password/i,
      });
      const confirmPassToggle = within(confirmPassWrapper).getByRole("button", {
        name: /show password/i,
      });

      expect(newPassInput).toHaveAttribute("type", "password");
      expect(confirmPassInput).toHaveAttribute("type", "password");

      await user.click(newPassToggle);
      expect(newPassInput).toHaveAttribute("type", "text");

      await user.click(confirmPassToggle);
      expect(confirmPassInput).toHaveAttribute("type", "text");

      const newPassHide = within(newPassWrapper).getByRole("button", {
        name: /hide password/i,
      });
      const confirmPassHide = within(confirmPassWrapper).getByRole("button", {
        name: /hide password/i,
      });

      await user.click(newPassHide);
      await user.click(confirmPassHide);

      expect(newPassInput).toHaveAttribute("type", "password");
      expect(confirmPassInput).toHaveAttribute("type", "password");
    });

    it("validates incomplete OTP length upon submission", async () => {
      const user = userEvent.setup();

      const otpBoxes = screen
        .getAllByRole("textbox")
        .filter((el) => el.classList.contains("otp-box")) as HTMLInputElement[];

      fireEvent.change(otpBoxes[0], { target: { value: "1" } });

      await user.type(
        screen.getByPlaceholderText("Min 8 characters"),
        "Pass123456",
      );
      await user.type(
        screen.getByPlaceholderText("Confirm new password"),
        "Pass123456",
      );
      await user.click(screen.getByRole("button", { name: "Change Password" }));

      expect(toast.error).toHaveBeenCalledWith(
        "Please enter the complete 6-digit verification code.",
      );
      expect(mockResetPasswordMutate).not.toHaveBeenCalled();
    });

    it("submits password reset successfully with fallback message", async () => {
      const user = userEvent.setup();

      mockResetPasswordMutate.mockImplementation((_data, { onSuccess }) => {
        onSuccess({});
      });

      const otpBoxes = screen
        .getAllByRole("textbox")
        .filter((el) => el.classList.contains("otp-box")) as HTMLInputElement[];

      fireEvent.paste(otpBoxes[0], {
        clipboardData: { getData: () => "123456" },
      });

      await user.type(
        screen.getByPlaceholderText("Min 8 characters"),
        "Pass123456",
      );
      await user.type(
        screen.getByPlaceholderText("Confirm new password"),
        "Pass123456",
      );
      await user.click(screen.getByRole("button", { name: "Change Password" }));

      expect(toast.success).toHaveBeenCalledWith(
        "Password reset successfully! Please log in.",
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("handles password reset error with fallback string", async () => {
      const user = userEvent.setup();

      mockResetPasswordMutate.mockImplementation((_data, { onError }) => {
        onError({});
      });

      const otpBoxes = screen
        .getAllByRole("textbox")
        .filter((el) => el.classList.contains("otp-box")) as HTMLInputElement[];

      fireEvent.paste(otpBoxes[0], {
        clipboardData: { getData: () => "123456" },
      });

      await user.type(
        screen.getByPlaceholderText("Min 8 characters"),
        "Pass123456",
      );
      await user.type(
        screen.getByPlaceholderText("Confirm new password"),
        "Pass123456",
      );
      await user.click(screen.getByRole("button", { name: "Change Password" }));

      expect(toast.error).toHaveBeenCalledWith(
        "Invalid or expired reset code.",
      );
    });
  });

  describe("Resend OTP Timer & Early Return Branches (Lines 253-256)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("hits lines 253-256: does nothing when resend is clicked during active cooldown", async () => {
      mockForgotPasswordMutate.mockImplementation((_data, { onSuccess }) => {
        onSuccess({ message: "Code sent", resetToken: "tok" });
      });

      renderLogin();

      fireEvent.click(screen.getByText(/forgot password\?/i));
      const modal = screen
        .getByText("Reset Password")
        .closest(".reset-modal-card") as HTMLElement;
      const emailInput = within(modal).getByPlaceholderText("name@example.com");
      fireEvent.change(emailInput, { target: { value: "aly@example.com" } });

      await act(async () => {
        fireEvent.submit(emailInput.closest("form")!);
      });

      // At this point resendCooldown is 900. Click button directly to trigger line 253 early return
      const resendBtn = screen.getByRole("button", { name: /resend code \(/i });
      fireEvent.click(resendBtn);

      // Only the initial email submission occurred
      expect(mockForgotPasswordMutate).toHaveBeenCalledTimes(1);

      // Advance timer by 60s to check mm:ss formatting
      act(() => {
        vi.advanceTimersByTime(60000);
      });
      expect(screen.getByText(/Resend Code \(14:00\)/i)).toBeInTheDocument();

      // Advance remaining cooldown
      act(() => {
        vi.advanceTimersByTime(14 * 60 * 1000);
      });

      const enabledResendBtn = screen.getByRole("button", {
        name: /^resend code$/i,
      });
      expect(enabledResendBtn).toBeEnabled();

      mockForgotPasswordMutate.mockImplementation((_data, { onSuccess }) => {
        onSuccess({ message: "Resent successfully", resetToken: "tok-2" });
      });

      fireEvent.click(enabledResendBtn);
      expect(mockForgotPasswordMutate).toHaveBeenCalledWith(
        { email: "aly@example.com" },
        expect.any(Object),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "A fresh verification code has been sent.",
      );
    });

    it("displays error toast on resend failure with fallback message", async () => {
      mockForgotPasswordMutate.mockImplementationOnce(
        (_data, { onSuccess }) => {
          onSuccess({ message: "Code sent", resetToken: "tok" });
        },
      );

      renderLogin();

      fireEvent.click(screen.getByText(/forgot password\?/i));
      const modal = screen
        .getByText("Reset Password")
        .closest(".reset-modal-card") as HTMLElement;
      const emailInput = within(modal).getByPlaceholderText("name@example.com");
      fireEvent.change(emailInput, { target: { value: "aly@example.com" } });

      await act(async () => {
        fireEvent.submit(emailInput.closest("form")!);
      });

      // Drain cooldown
      act(() => {
        vi.advanceTimersByTime(900000);
      });

      mockForgotPasswordMutate.mockImplementationOnce((_data, { onError }) => {
        onError({});
      });

      const resendBtn = screen.getByRole("button", { name: /^resend code$/i });
      fireEvent.click(resendBtn);

      expect(toast.error).toHaveBeenCalledWith("Failed to resend reset code.");
    });
  });
});
