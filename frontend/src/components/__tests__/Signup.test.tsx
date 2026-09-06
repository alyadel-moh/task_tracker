import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import Signup from "../Signup";

// ---- Mocks ----
const mockMutate = vi.fn();
const mockResendMutate = vi.fn();
const mockVerifyMutate = vi.fn();
const mockNavigate = vi.fn();

let mockSignupPending = false;
let mockResendPending = false;
let mockVerifyPending = false;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../hooks/registerHook", () => ({
  default: vi.fn(() => ({ mutate: mockMutate, isPending: mockSignupPending })),
}));

vi.mock("../../hooks/handleResendEmailHook", () => ({
  useResendVerification: vi.fn(() => ({
    mutate: mockResendMutate,
    isPending: mockResendPending,
  })),
}));

vi.mock("../../hooks/verifyOtpHook", () => ({
  useVerifyOtp: vi.fn(() => ({
    mutate: mockVerifyMutate,
    isPending: mockVerifyPending,
  })),
}));

vi.mock("../../hooks/UploadPhoto", () => ({
  uploadImageToCloudinary: vi
    .fn()
    .mockResolvedValue("https://cdn.test/photo.jpg"),
}));

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const renderSignup = () =>
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>,
  );

const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) => {
  const {
    name = "Aly Adel",
    email = "aly@example.com",
    password = "password123",
  } = overrides;
  if (name)
    await user.type(screen.getByPlaceholderText(/enter your username/i), name);
  if (email)
    await user.type(screen.getByPlaceholderText(/name@example.com/i), email);
  if (password)
    await user.type(
      screen.getByPlaceholderText(/at least 8 characters/i),
      password,
    );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSignupPending = false;
  mockResendPending = false;
  mockVerifyPending = false;
});

describe("Signup - form step", () => {
  it("renders all registration fields", () => {
    renderSignup();
    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter your username/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/name@example.com/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/at least 8 characters/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors and triggers error toast when submitting empty form", async () => {
    const user = userEvent.setup();
    const { toast } = await import("react-hot-toast");
    renderSignup();

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/name must be at least 2 characters/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/invalid email address/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "Please fill in all fields correctly.",
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("rejects a name shorter than 2 characters", async () => {
    const user = userEvent.setup();
    renderSignup();

    await fillForm(user, { name: "A" });
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/name must be at least 2 characters/i),
    ).toBeInTheDocument();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const user = userEvent.setup();
    renderSignup();

    await fillForm(user, { password: "short" });
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderSignup();

    const passwordInput = screen.getByPlaceholderText(
      /at least 8 characters/i,
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggleBtn = passwordInput.parentElement!.querySelector(
      ".password-toggle",
    ) as HTMLButtonElement;

    await user.click(toggleBtn);
    expect(passwordInput.type).toBe("text");

    await user.click(toggleBtn);
    expect(passwordInput.type).toBe("password");
  });

  it("submits valid data and moves to the OTP step", async () => {
    const user = userEvent.setup();
    mockMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({ token: "session-token-123" });
    });

    renderSignup();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0]).toMatchObject({
      name: "Aly Adel",
      email: "aly@example.com",
      password: "password123",
      photoUrl: null,
    });

    expect(
      await screen.findByRole("heading", { name: /enter verification code/i }),
    ).toBeInTheDocument();
  });

  it("shows a toast error when registration fails without backend message", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockMutate.mockImplementation((_payload, { onError }) => {
      onError({});
    });

    renderSignup();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Registration failed"),
    );
    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
  });

  it("shows error toast when profile photo upload throws an exception", async () => {
    const { uploadImageToCloudinary } = await import("../../hooks/UploadPhoto");
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();

    vi.mocked(uploadImageToCloudinary).mockRejectedValueOnce(
      new Error("Cloudinary down"),
    );

    renderSignup();
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const fileInput = document.getElementById(
      "photo-input",
    ) as HTMLInputElement;

    await user.upload(fileInput, file);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to upload profile photo.",
      ),
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("uploads a selected photo before submitting", async () => {
    const { uploadImageToCloudinary } = await import("../../hooks/UploadPhoto");
    const user = userEvent.setup();
    mockMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({ token: "tok" });
    });

    renderSignup();
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const fileInput = document.getElementById(
      "photo-input",
    ) as HTMLInputElement;

    await user.upload(fileInput, file);
    expect(await screen.findByAltText(/avatar preview/i)).toBeInTheDocument();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() =>
      expect(uploadImageToCloudinary).toHaveBeenCalledWith(file),
    );
    await waitFor(() =>
      expect(mockMutate.mock.calls[0][0]).toMatchObject({
        photoUrl: "https://cdn.test/photo.jpg",
      }),
    );
  });

  it("removes a selected photo preview", async () => {
    const user = userEvent.setup();
    renderSignup();

    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const fileInput = document.getElementById(
      "photo-input",
    ) as HTMLInputElement;
    await user.upload(fileInput, file);

    expect(await screen.findByAltText(/avatar preview/i)).toBeInTheDocument();

    await user.click(screen.getByText("×"));
    expect(screen.queryByAltText(/avatar preview/i)).not.toBeInTheDocument();
  });
});

describe("Signup - OTP step", () => {
  const goToOtpStep = async (user: ReturnType<typeof userEvent.setup>) => {
    mockMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({ token: "session-token-123" });
    });
    renderSignup();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    await screen.findByRole("heading", { name: /enter verification code/i });
  };

  it("distributes typed digits and ignores non-numeric keystrokes", async () => {
    const user = userEvent.setup();
    await goToOtpStep(user);

    const box0 = document.getElementById("signup-otp-0") as HTMLInputElement;
    fireEvent.change(box0, { target: { value: "a" } });
    expect(box0.value).toBe("");

    for (let i = 0; i < 6; i++) {
      const box = document.getElementById(
        `signup-otp-${i}`,
      ) as HTMLInputElement;
      fireEvent.change(box, { target: { value: String(i + 1) } });
    }

    const boxes = Array.from({ length: 6 }, (_, i) =>
      document.getElementById(`signup-otp-${i}`),
    ) as HTMLInputElement[];
    expect(boxes.map((b) => b.value).join("")).toBe("123456");
  });

  it("handles backspace navigation across empty and populated boxes", async () => {
    const user = userEvent.setup();
    await goToOtpStep(user);

    const box0 = document.getElementById("signup-otp-0") as HTMLInputElement;
    const box1 = document.getElementById("signup-otp-1") as HTMLInputElement;

    fireEvent.change(box0, { target: { value: "1" } });
    fireEvent.change(box1, { target: { value: "2" } });

    // Backspacing when box1 has a digit clears it
    fireEvent.keyDown(box1, { key: "Backspace" });
    expect(box1.value).toBe("");

    // Backspacing when box1 is empty clears and focuses previous box
    fireEvent.keyDown(box1, { key: "Backspace" });
    expect(box0.value).toBe("");
  });

  it("handles pasting a full 6-digit code", async () => {
    const user = userEvent.setup();
    await goToOtpStep(user);

    const firstBox = document.getElementById("signup-otp-0")!;
    fireEvent.paste(firstBox, {
      clipboardData: { getData: () => "654321" },
    });

    const boxes = Array.from({ length: 6 }, (_, i) =>
      document.getElementById(`signup-otp-${i}`),
    ) as HTMLInputElement[];
    expect(boxes.map((b) => b.value).join("")).toBe("654321");
  });

  it("disables Verify button until all 6 digits are entered", async () => {
    const user = userEvent.setup();
    await goToOtpStep(user);

    const verifyBtn = screen.getByRole("button", {
      name: /verify & complete/i,
    });
    expect(verifyBtn).toBeDisabled();

    await user.type(document.getElementById("signup-otp-0")!, "1");
    expect(verifyBtn).toBeDisabled();
  });

  it("submits the OTP and shows the success step", async () => {
    const user = userEvent.setup();
    await goToOtpStep(user);
    mockVerifyMutate.mockImplementation((_payload, { onSuccess }) =>
      onSuccess(),
    );

    const firstBox = document.getElementById("signup-otp-0")!;
    fireEvent.paste(firstBox, {
      clipboardData: { getData: () => "123456" },
    });

    await user.click(
      screen.getByRole("button", { name: /verify & complete/i }),
    );

    expect(mockVerifyMutate).toHaveBeenCalledWith(
      expect.objectContaining({ otp: "123456", token: "session-token-123" }),
      expect.anything(),
    );
    expect(
      await screen.findByRole("heading", { name: /account created/i }),
    ).toBeInTheDocument();
  });

  it("shows a toast error for an invalid OTP with fallback message", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    await goToOtpStep(user);
    mockVerifyMutate.mockImplementation((_payload, { onError }) => onError({}));

    const firstBox = document.getElementById("signup-otp-0")!;
    fireEvent.paste(firstBox, {
      clipboardData: { getData: () => "000000" },
    });

    await user.click(
      screen.getByRole("button", { name: /verify & complete/i }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Invalid OTP code."),
    );
  });
});

describe("Signup - Resend OTP & Countdown Timers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("decrements timer and allows resending after cooldown expires", async () => {
    mockMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({ token: "session-token-123" });
    });

    renderSignup();

    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), {
      target: { value: "Aly Adel" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { value: "aly@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), {
      target: { value: "password123" },
    });

    await act(async () => {
      fireEvent.submit(
        screen.getByRole("button", { name: /sign up/i }).closest("form")!,
      );
    });

    const resendBtn = screen.getByRole("button", { name: /resend code/i });
    expect(resendBtn).toBeDisabled();
    expect(screen.getByText(/resend code \(15:00\)/i)).toBeInTheDocument();

    // Advance 60 seconds
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByText(/resend code \(14:00\)/i)).toBeInTheDocument();

    // Advance remainder of 15 minutes
    act(() => {
      vi.advanceTimersByTime(14 * 60 * 1000);
    });

    expect(
      screen.getByRole("button", { name: /^resend code$/i }),
    ).toBeEnabled();

    mockResendMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({ token: "new-session-token" });
    });

    fireEvent.click(screen.getByRole("button", { name: /^resend code$/i }));
    expect(mockResendMutate).toHaveBeenCalledWith(
      expect.objectContaining({ email: "aly@example.com" }),
      expect.any(Object),
    );
  });

  it("handles resend failure toast fallback message", async () => {
    mockMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({ token: "session-token-123" });
    });

    renderSignup();

    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), {
      target: { value: "Aly Adel" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
      target: { value: "aly@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), {
      target: { value: "password123" },
    });

    await act(async () => {
      fireEvent.submit(
        screen.getByRole("button", { name: /sign up/i }).closest("form")!,
      );
    });

    // Drain cooldown
    act(() => {
      vi.advanceTimersByTime(900000);
    });

    mockResendMutate.mockImplementation((_payload, { onError }) => {
      onError({});
    });

    fireEvent.click(screen.getByRole("button", { name: /^resend code$/i }));
    expect(mockResendMutate).toHaveBeenCalled();
  });
});

describe("Signup - success step", () => {
  it("navigates to /login when 'Proceed to Log in' is clicked", async () => {
    const user = userEvent.setup();
    mockMutate.mockImplementation((_payload, { onSuccess }) =>
      onSuccess({ token: "t" }),
    );
    mockVerifyMutate.mockImplementation((_payload, { onSuccess }) =>
      onSuccess(),
    );

    renderSignup();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    await screen.findByRole("heading", { name: /enter verification code/i });

    const firstBox = document.getElementById("signup-otp-0")!;
    fireEvent.paste(firstBox, {
      clipboardData: { getData: () => "123456" },
    });

    await user.click(
      screen.getByRole("button", { name: /verify & complete/i }),
    );
    await screen.findByRole("heading", { name: /account created/i });

    await user.click(
      screen.getByRole("button", { name: /proceed to log in/i }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
