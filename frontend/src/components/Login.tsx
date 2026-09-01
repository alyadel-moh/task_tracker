import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckSquare,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  X,
  RotateCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import useLogin from "../hooks/loginHook";
import {
  useForgotPassword,
  useResetPassword,
} from "../hooks/forgetPasswordHook";
import "../css/Login.css";
import { Link, useNavigate } from "react-router-dom";

// ==========================================
// Form Schemas
// ==========================================
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotEmailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotEmailFormData = z.infer<typeof forgotEmailSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const Login: React.FC = () => {
  // Login State
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP 6-Box State
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 15-Minute Countdown Timer (in seconds: 15 * 60 = 900)
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const loginMutation = useLogin();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();

  // Helper function to format seconds into mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Cooldown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP box on step change
  useEffect(() => {
    if (resetStep === "OTP" && showResetModal) {
      inputRefs.current[0]?.focus();
    }
  }, [resetStep, showResetModal]);

  // React Hook Forms
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

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

  // ==========================================
  // OTP Box Handlers
  // ==========================================
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
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
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

  // ==========================================
  // Submission Handlers
  // ==========================================
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
          setResendCooldown(900); // 15 minutes
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

  const handleResendOtp = () => {
    if (resendCooldown > 0 || !resetEmail) return;

    forgotPasswordMutation.mutate(
      { email: resetEmail },
      {
        onSuccess: (res) => {
          toast.success("A fresh verification code has been sent.");
          if (res.resetToken) {
            setResetToken(res.resetToken);
          }
          setResendCooldown(900); // 15 minutes
          setOtpDigits(Array(6).fill(""));
          inputRefs.current[0]?.focus();
        },
        onError: (err) => {
          toast.error(
            err.response?.data?.message || "Failed to resend reset code.",
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
    setShowNewPassword(false);
    setShowConfirmPassword(false);
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
          onSubmit={handleSubmitLogin(onSubmitLogin)}
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
                {...registerLogin("email")}
              />
            </div>
            {loginErrors.email && (
              <small className="field-error">{loginErrors.email.message}</small>
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
                type={showLoginPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...registerLogin("password")}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowLoginPassword((current) => !current)}
                aria-label={
                  showLoginPassword ? "Hide password" : "Show password"
                }
              >
                {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {loginErrors.password && (
              <small className="field-error">
                {loginErrors.password.message}
              </small>
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

      {/* ==========================================
          Forgot & Reset Password Modal
          ========================================== */}
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
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Step Progression Indicators */}
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

            {/* STEP 1: Email Form */}
            {resetStep === "EMAIL" ? (
              <>
                <div className="login-logo reset-modal-logo">
                  <Mail size={20} strokeWidth={2} />
                </div>
                <h2 className="login-title reset-modal-title">
                  Reset Password
                </h2>
                <p className="login-subtitle">
                  Enter your email address to receive a 6-digit verification
                  code.
                </p>

                <form
                  className="login-form"
                  onSubmit={handleSubmitEmail(onSubmitForgotEmail)}
                  noValidate
                >
                  <label className="field">
                    <span className="field-label">Email Address</span>
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        autoFocus
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
              /* STEP 2: OTP + New Password Form */
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
                  {/* OTP 6-Digit Segmented Box */}
                  <div className="field">
                    <div className="field-label-row">
                      <span className="field-label">Verification Code</span>
                      <button
                        type="button"
                        className="resend-code-btn"
                        onClick={handleResendOtp}
                        disabled={
                          resendCooldown > 0 || forgotPasswordMutation.isPending
                        }
                      >
                        {forgotPasswordMutation.isPending ? (
                          <Loader2 size={12} className="spin" />
                        ) : (
                          <RotateCw size={12} />
                        )}
                        {resendCooldown > 0
                          ? `Resend Code (${formatTimer(resendCooldown)})`
                          : "Resend Code"}
                      </button>
                    </div>

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
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>
                  </div>

                  {/* New Password */}
                  <label className="field">
                    <span className="field-label">New Password</span>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Min 8 characters"
                        {...registerReset("newPassword")}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowNewPassword((curr) => !curr)}
                        aria-label={
                          showNewPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    {resetErrors.newPassword && (
                      <small className="field-error">
                        {resetErrors.newPassword.message}
                      </small>
                    )}
                  </label>

                  {/* Confirm Password */}
                  <label className="field">
                    <span className="field-label">Confirm Password</span>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        {...registerReset("confirmPassword")}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword((curr) => !curr)}
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
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
