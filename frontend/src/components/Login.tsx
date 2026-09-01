import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckSquare, Mail, Lock, Eye, EyeOff, Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import useLogin from "../hooks/loginHook";
import {
  useForgotPassword,
  useResetPassword,
} from "../hooks/forgetPasswordHook";
import "../css/Login.css";
import { Link, useNavigate } from "react-router-dom";

// --- Form Schemas ---
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const forgotEmailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotEmailFormData = z.infer<typeof forgotEmailSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();
  const loginMutation = useLogin();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();

  useEffect(() => {
    if (resetStep === "OTP") {
      inputRefs.current[0]?.focus();
    }
  }, [resetStep]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<ForgotEmailFormData>({
    resolver: zodResolver(forgotEmailSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    reset: resetResetForm,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtpDigits(newOtp);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const onSubmitLogin = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: (res: any) => {
        toast.success(res?.message || "Welcome back!");
        navigate("/projects");
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ?? "Invalid email or password.";
        toast.error(message);
      },
    });
  };

  const onSubmitForgotEmail = (data: ForgotEmailFormData) => {
    forgotPasswordMutation.mutate(
      { email: data.email },
      {
        onSuccess: (res) => {
          toast.success(res.message || "Reset code sent to your email.");
          setResetEmail(data.email);
          if (res.resetToken) {
            setResetToken(res.resetToken);
          }
          setResetStep("OTP");
        },
        onError: (err) => {
          toast.error(
            err.response?.data?.message || "Failed to send reset code.",
          );
        },
      },
    );
  };

  const onSubmitResetPassword = (data: ResetPasswordFormData) => {
    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    resetPasswordMutation.mutate(
      {
        email: resetEmail,
        otp: fullOtp,
        newPassword: data.newPassword,
        resetToken,
      },
      {
        onSuccess: (res) => {
          toast.success(
            res.message || "Password reset successfully! Please log in.",
          );
          closeModal();
        },
        onError: (err) => {
          toast.error(
            err.response?.data?.message || "Invalid or expired reset code.",
          );
        },
      },
    );
  };

  const closeModal = () => {
    setShowResetModal(false);
    setResetStep("EMAIL");
    setResetEmail("");
    setResetToken("");
    setOtpDigits(Array(6).fill(""));
    resetResetForm();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <CheckSquare size={20} strokeWidth={2} />
        </div>

        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Log in to your tasktrack account.</p>

        <form
          className="login-form"
          onSubmit={handleSubmit(onSubmitLogin)}
          noValidate
        >
          <label className="field">
            <span className="field-label">Email</span>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" aria-hidden="true" />
              <input
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <small className="field-error">{errors.email.message}</small>
            )}
          </label>

          <label className="field">
            <div className="field-label-row">
              <span className="field-label">Password</span>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => setShowResetModal(true)}
              >
                Forgot password?
              </button>
            </div>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password")}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <small className="field-error">{errors.password.message}</small>
            )}
          </label>

          <button
            type="submit"
            className="login-submit"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 size={16} className="spin" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </button>
        </form>

        <p className="login-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>

      {/* --- Forgot Password Modal --- */}
      {showResetModal && (
        <div className="reset-modal-overlay" onClick={closeModal}>
          <div
            className="login-card reset-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="reset-modal-close"
              onClick={closeModal}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="reset-steps">
              <div
                className={`reset-step ${resetStep === "EMAIL" ? "active" : "done"}`}
              >
                <span className="reset-step-dot">
                  {resetStep === "OTP" ? "✓" : "1"}
                </span>
                <span>Email</span>
              </div>
              <span className="reset-step-line" />
              <div
                className={`reset-step ${resetStep === "OTP" ? "active" : ""}`}
              >
                <span className="reset-step-dot">2</span>
                <span>Reset</span>
              </div>
            </div>

            {resetStep === "EMAIL" ? (
              <>
                <div className="login-logo reset-modal-logo">
                  <Mail size={20} strokeWidth={2} />
                </div>
                <h2 className="login-title reset-modal-title">
                  Reset Password
                </h2>
                <p className="login-subtitle">
                  Enter your email to receive a 6-digit verification code.
                </p>

                <form
                  className="login-form"
                  onSubmit={handleSubmitEmail(onSubmitForgotEmail)}
                  noValidate
                >
                  <label className="field">
                    <span className="field-label">Email</span>
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        {...registerEmail("email")}
                      />
                    </div>
                    {emailErrors.email && (
                      <small className="field-error">
                        {emailErrors.email.message}
                      </small>
                    )}
                  </label>

                  <button
                    type="submit"
                    className="login-submit"
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="spin" /> Sending Code...
                      </>
                    ) : (
                      "Send Reset Code"
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="login-logo reset-modal-logo">
                  <Lock size={20} strokeWidth={2} />
                </div>
                <h2 className="login-title reset-modal-title">
                  Enter Verification Code
                </h2>
                <p className="login-subtitle">
                  We sent a 6-digit code to{" "}
                  <strong className="highlight-email">{resetEmail}</strong>
                </p>

                <form
                  className="login-form"
                  onSubmit={handleSubmitReset(onSubmitResetPassword)}
                  noValidate
                >
                  <div className="field">
                    <span className="field-label">Verification Code</span>
                    <div className="otp-input-row">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            inputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="otp-box"
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                        />
                      ))}
                    </div>
                  </div>

                  <label className="field">
                    <span className="field-label">New Password</span>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        type="password"
                        placeholder="Min 8 characters"
                        {...registerReset("newPassword")}
                      />
                    </div>
                    {resetErrors.newPassword && (
                      <small className="field-error">
                        {resetErrors.newPassword.message}
                      </small>
                    )}
                  </label>

                  <label className="field">
                    <span className="field-label">Confirm Password</span>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        {...registerReset("confirmPassword")}
                      />
                    </div>
                    {resetErrors.confirmPassword && (
                      <small className="field-error">
                        {resetErrors.confirmPassword.message}
                      </small>
                    )}
                  </label>

                  <button
                    type="submit"
                    className="login-submit"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="spin" /> Resetting...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
