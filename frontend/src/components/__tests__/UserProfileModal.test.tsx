import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import UserProfileModal from "../UserProfileModal";
import type { User } from "../types";
import { toast } from "react-hot-toast";

// Mock child inline field to simplify testing inputs
vi.mock("../InlineEditField", () => ({
  default: ({ value, placeholder, onSave }: any) => (
    <input
      data-testid={placeholder?.includes("name") ? "name-input" : "email-input"}
      value={value ?? ""}
      onChange={(e) => onSave(e.target.value)}
    />
  ),
}));

let mockUpdateUserPending = false;
const mockUpdateUserMutate = vi.fn();
vi.mock("../../hooks/updateUserHook", () => ({
  default: () => ({
    mutate: mockUpdateUserMutate,
    get isPending() {
      return mockUpdateUserPending;
    },
  }),
}));

let mockVerifyEmailPending = false;
const mockVerifyUpdatedEmailMutate = vi.fn();
vi.mock("../../hooks/verifyUpdatedEmailHook", () => ({
  useVerifyUpdatedEmailOtp: () => ({
    mutate: mockVerifyUpdatedEmailMutate,
    get isPending() {
      return mockVerifyEmailPending;
    },
  }),
}));

const mockUploadImageToCloudinary = vi.fn();
vi.mock("../../hooks/UploadPhoto", () => ({
  uploadImageToCloudinary: (...args: any[]) =>
    mockUploadImageToCloudinary(...args),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const baseUser: User = {
  id: "u1",
  name: "Aly Adel",
  email: "aly@example.com",
  photoUrl: "https://example.com/avatar.jpg",
};

describe("UserProfileModal 100% Branch Coverage", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUserPending = false;
    mockVerifyEmailPending = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering & Visibility", () => {
    it("returns null when user prop is null", () => {
      const { container } = render(
        <UserProfileModal user={null} onClose={mockOnClose} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders user details and avatar fallback initials for single/empty names", () => {
      const userEmptyName: User = { ...baseUser, name: "", photoUrl: null };
      const { rerender } = render(
        <UserProfileModal user={userEmptyName} onClose={mockOnClose} />,
      );
      expect(screen.getByText("U")).toBeInTheDocument();

      const userSingleName: User = { ...baseUser, name: "Aly", photoUrl: null };
      rerender(
        <UserProfileModal user={userSingleName} onClose={mockOnClose} />,
      );
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("handles image load error and renders initials fallback", () => {
      render(<UserProfileModal user={baseUser} onClose={mockOnClose} />);
      const avatar = screen.getByRole("img", { name: "Aly Adel" });
      fireEvent.error(avatar);
      expect(screen.getByText("AA")).toBeInTheDocument();
    });
  });

  describe("Modal Dismissal & Propagation", () => {
    it("calls onClose when close button or overlay is clicked", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <UserProfileModal user={baseUser} onClose={mockOnClose} />,
      );

      await user.click(screen.getByRole("button", { name: /close/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      const overlay = container.querySelector(".modal-overlay") as HTMLElement;
      await user.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });

    it("stops propagation when clicking inside the modal card", () => {
      const { container } = render(
        <UserProfileModal user={baseUser} onClose={mockOnClose} />,
      );
      const card = container.querySelector(".modal-card") as HTMLElement;
      fireEvent.click(card);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("handles Escape key to close modal or close OTP view if open", () => {
      mockUpdateUserMutate.mockImplementation((_p, { onSuccess }) => {
        onSuccess({
          requiresEmailVerification: true,
          pendingEmail: "new@example.com",
          emailVerificationToken: "tok-1",
        });
      });

      render(<UserProfileModal user={baseUser} onClose={mockOnClose} />);

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "new@example.com" },
      });
      expect(screen.getByText(/enter verification code/i)).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });
      expect(
        screen.queryByText(/enter verification code/i),
      ).not.toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();

      fireEvent.keyDown(document, { key: "Escape" });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Profile Updates & Image Upload", () => {
    it("handles auto-save error and rolls back user draft", () => {
      mockUpdateUserMutate.mockImplementation((_payload, { onError }) => {
        onError({ response: { data: { message: "Network failure" } } });
      });

      render(<UserProfileModal user={baseUser} onClose={mockOnClose} />);

      const nameInput = screen.getByTestId("name-input");
      fireEvent.change(nameInput, { target: { value: "Failed Name" } });

      expect(toast.error).toHaveBeenCalledWith("Network failure", {
        id: "user-update",
      });
      expect(screen.getByTestId("name-input")).toHaveValue("Aly Adel");
    });

    it("handles auto-save error fallback message", () => {
      mockUpdateUserMutate.mockImplementation((_payload, { onError }) => {
        onError({});
      });

      render(<UserProfileModal user={baseUser} onClose={mockOnClose} />);

      fireEvent.change(screen.getByTestId("name-input"), {
        target: { value: "Other Name" },
      });
      expect(toast.error).toHaveBeenCalledWith("Failed to update profile", {
        id: "user-update",
      });
    });

    it("handles photo upload failure", async () => {
      mockUploadImageToCloudinary.mockRejectedValueOnce(
        new Error("Upload error"),
      );
      const { container } = render(
        <UserProfileModal user={baseUser} onClose={mockOnClose} />,
      );

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File(["content"], "test.png", { type: "image/png" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to upload profile photo",
        );
      });
    });

    it("ignores file input change when no file is selected", () => {
      const { container } = render(
        <UserProfileModal user={baseUser} onClose={mockOnClose} />,
      );
      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [] } });
      expect(mockUploadImageToCloudinary).not.toHaveBeenCalled();
    });

    it("cleans file input value when deleting photo", async () => {
      const user = userEvent.setup();
      render(<UserProfileModal user={baseUser} onClose={mockOnClose} />);

      const deletePhotoBtn = screen.getByRole("button", {
        name: /delete photo/i,
      });
      await user.click(deletePhotoBtn);

      expect(mockUpdateUserMutate).toHaveBeenCalledWith(
        { photoUrl: null },
        expect.any(Object),
      );
    });
  });

  describe("Email OTP Verification (Lines 196-198, 312-314, 405)", () => {
    beforeEach(() => {
      mockUpdateUserMutate.mockImplementation((_p, { onSuccess }) => {
        onSuccess({
          requiresEmailVerification: true,
          pendingEmail: "pending@example.com",
          emailVerificationToken: "token-999",
        });
      });
    });

    it("prevents submission and displays error when OTP length is invalid", () => {
      render(<UserProfileModal user={baseUser} onClose={mockOnClose} />);

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "pending@example.com" },
      });

      const form = document.querySelector("form")!;
      fireEvent.submit(form);

      expect(toast.error).toHaveBeenCalledWith(
        "Please enter a valid 6-digit code.",
      );
      expect(mockVerifyUpdatedEmailMutate).not.toHaveBeenCalled();
    });

    it("handles verify email OTP success and failure callbacks", () => {
      render(<UserProfileModal user={baseUser} onClose={mockOnClose} />);

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "pending@example.com" },
      });

      const otpInputs = document.querySelectorAll(".otp-box");
      for (let i = 0; i < 6; i++) {
        fireEvent.change(otpInputs[i], { target: { value: "7" } });
      }

      mockVerifyUpdatedEmailMutate.mockImplementation((_p, { onSuccess }) => {
        onSuccess();
      });

      fireEvent.submit(document.querySelector("form")!);

      expect(toast.success).toHaveBeenCalledWith("Email updated successfully!");
      expect(
        screen.queryByText(/enter verification code/i),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("email-input")).toHaveValue(
        "pending@example.com",
      );

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "another@example.com" },
      });

      const nextOtpInputs = document.querySelectorAll(".otp-box");
      for (let i = 0; i < 6; i++) {
        fireEvent.change(nextOtpInputs[i], { target: { value: "8" } });
      }

      mockVerifyUpdatedEmailMutate.mockImplementation((_p, { onError }) => {
        onError({});
      });

      fireEvent.submit(document.querySelector("form")!);
      expect(toast.error).toHaveBeenCalledWith(
        "Invalid or expired verification code",
      );
    });

    it("handles keyboard backspacing across OTP inputs", () => {
      render(<UserProfileModal user={baseUser} onClose={mockOnClose} />);

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "pending@example.com" },
      });

      const otpInputs = document.querySelectorAll(
        ".otp-box",
      ) as NodeListOf<HTMLInputElement>;

      fireEvent.change(otpInputs[0], { target: { value: "1" } });
      fireEvent.change(otpInputs[1], { target: { value: "2" } });

      fireEvent.keyDown(otpInputs[1], { key: "Backspace" });
      expect(otpInputs[1].value).toBe("");

      fireEvent.keyDown(otpInputs[1], { key: "Backspace" });
      expect(otpInputs[0].value).toBe("");
    });

    it("hits lines 312-314: handles paste focusing targetBox, missing targetBox branch, and empty paste", () => {
      render(<UserProfileModal user={baseUser} onClose={mockOnClose} />);

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "pending@example.com" },
      });

      const boxes = document.querySelectorAll(".otp-box");
      const firstBox = boxes[0];

      // 1. Non-numeric paste -> triggers if (!pasted) return;
      fireEvent.paste(firstBox, {
        clipboardData: {
          getData: () => "abcdef",
        },
      });
      expect((firstBox as HTMLInputElement).value).toBe("");

      // 2. Partial paste with valid targetBox element found (pasted.length < 5)
      fireEvent.paste(firstBox, {
        clipboardData: {
          getData: () => "123",
        },
      });
      const targetBox3 = document.getElementById("update-email-otp-3");
      expect(document.activeElement).toBe(targetBox3);

      // 3. 6-digit paste (Math.min(6, 5) -> targetIndex 5)
      fireEvent.paste(firstBox, {
        clipboardData: {
          getData: () => "123456",
        },
      });
      const targetBox5 = document.getElementById("update-email-otp-5");
      expect(document.activeElement).toBe(targetBox5);

      // 4. Paste where getElementById returns null to hit `if (targetBox)` false branch (Line 314)
      const originalGetElementById = document.getElementById.bind(document);
      vi.spyOn(document, "getElementById").mockReturnValue(null);

      fireEvent.paste(firstBox, {
        clipboardData: {
          getData: () => "456",
        },
      });

      document.getElementById = originalGetElementById;
    });

    it("hits lines 196-198: early return when resendCooldown > 0 or pendingNewEmail is empty", () => {
      vi.useFakeTimers();

      // Trigger OTP mode with empty pendingEmail to hit `!pendingNewEmail` branch (Line 196)
      mockUpdateUserMutate.mockImplementationOnce((_p, { onSuccess }) => {
        onSuccess({
          requiresEmailVerification: true,
          pendingEmail: "",
          emailVerificationToken: "token-empty",
        });
      });

      render(<UserProfileModal user={baseUser} onClose={mockOnClose} />);
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "temp@example.com" },
      });

      // Clear cooldown so resendCooldown === 0
      act(() => {
        vi.advanceTimersByTime(900 * 1000);
      });

      // Attempt resend when pendingNewEmail is empty: returns early
      const resendBtn = screen.getByRole("button", { name: /resend code$/i });
      fireEvent.click(resendBtn);

      expect(mockUpdateUserMutate).toHaveBeenCalledTimes(1); // Only the initial save

      // Cancel back to the main profile form
      const cancelBtn = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelBtn);

      // Now trigger OTP mode WITH pendingEmail to test resendCooldown > 0 early return
      mockUpdateUserMutate.mockImplementationOnce((_p, { onSuccess }) => {
        onSuccess({
          requiresEmailVerification: true,
          pendingEmail: "actual@example.com",
          emailVerificationToken: "token-actual",
        });
      });

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "actual@example.com" },
      });

      // Cooldown is 900 -> click resend button directly to hit resendCooldown > 0 early return
      const disabledResendBtn = screen.getByRole("button", {
        name: /resend code in 15 mins/i,
      });
      fireEvent.click(disabledResendBtn);

      expect(mockUpdateUserMutate).toHaveBeenCalledTimes(2); // Initial save + second save
    });

    it("hits line 405: cooldown timer display, resend execution without new token, and loading spinners", () => {
      vi.useFakeTimers();

      render(<UserProfileModal user={baseUser} onClose={mockOnClose} />);

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "pending@example.com" },
      });

      // Cooldown is 900 -> shows countdown (Line 405)
      expect(screen.getByText(/resend code in 15 mins/i)).toBeInTheDocument();

      // Fast-forward cooldown by 900 seconds
      act(() => {
        vi.advanceTimersByTime(900 * 1000);
      });

      expect(screen.getByText(/resend code$/i)).toBeInTheDocument();

      // Successful resend without new token (res.emailVerificationToken is undefined)
      mockUpdateUserMutate.mockImplementationOnce((_p, { onSuccess }) => {
        onSuccess({});
      });
      fireEvent.click(screen.getByRole("button", { name: /resend code/i }));
      expect(toast.success).toHaveBeenCalledWith("New verification code sent!");

      // Fast forward again to test error branch
      act(() => {
        vi.advanceTimersByTime(900 * 1000);
      });
      mockUpdateUserMutate.mockImplementationOnce((_p, { onError }) => {
        onError({});
      });
      fireEvent.click(screen.getByRole("button", { name: /resend code/i }));
      expect(toast.error).toHaveBeenCalledWith("Failed to resend code.");

      // Test updateUserMutation.isPending renders spinner on resend button
      act(() => {
        vi.advanceTimersByTime(900 * 1000);
      });
      mockUpdateUserPending = true;
      const { container } = render(
        <UserProfileModal user={baseUser} onClose={mockOnClose} />,
      );
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "pending@example.com" },
      });
      expect(container.querySelector(".resend-btn .spin")).toBeInTheDocument();

      // Test verifyUpdatedEmailMutation.isPending renders spinner on submit button
      mockVerifyEmailPending = true;
      const { container: container2 } = render(
        <UserProfileModal user={baseUser} onClose={mockOnClose} />,
      );
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "pending@example.com" },
      });
      expect(screen.getByText(/verifying.../i)).toBeInTheDocument();
      expect(
        container2.querySelector(".signup-submit .spin"),
      ).toBeInTheDocument();
    });
  });
});
