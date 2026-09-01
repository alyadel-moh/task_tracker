import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckSquare,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Camera,
  UploadCloud,
  KeyRound,
  RotateCw,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import "../css/Signup.css";
import useRegister from "../hooks/registerHook";
import { useResendVerification } from "../hooks/handleResendEmailHook";
import { useVerifyOtp } from "../hooks/verifyOtpHook";
import { uploadImageToCloudinary } from "../hooks/UploadPhoto";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.email("Invalid email address").min(1, "Email is required"),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

type FormData = z.infer<typeof schema>;

interface PendingData extends FormData {
  photoUrl?: string | null;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // OTP Verification state
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [otp, setOtp] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [pendingUser, setPendingUser] = useState<PendingData | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const signupMutation = useRegister();
  const resendMutation = useResendVerification();
  const verifyOtpMutation = useVerifyOtp();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Format seconds into mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      let photoUrl: string | null = null;
      if (selectedFile) {
        setIsUploadingPhoto(true);
        photoUrl = await uploadImageToCloudinary(selectedFile);
      }

      const payload: PendingData = {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        photoUrl: photoUrl || null,
      };

      signupMutation.mutate(payload, {
        onSuccess: (res: any) => {
          setPendingUser(payload);
          setSessionToken(res.token);
          setStep("otp");
          setResendCooldown(900); // 15 minutes
          toast.success("Verification code sent to your email!");
          reset();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Registration failed");
        },
      });
    } catch {
      toast.error("Failed to upload profile photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6 || !pendingUser) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    verifyOtpMutation.mutate(
      { email: pendingUser.email, otp: otp.trim(), token: sessionToken },
      {
        onSuccess: () => {
          setStep("success");
          toast.success("Account created successfully!");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Invalid OTP code.");
        },
      },
    );
  };

  const handleResendOtp = () => {
    if (!pendingUser || resendCooldown > 0) return;

    resendMutation.mutate(pendingUser, {
      onSuccess: (res: any) => {
        if (res?.token) setSessionToken(res.token);
        setResendCooldown(900); // 15 minutes
        toast.success("New verification code sent!");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to resend code.");
      },
    });
  };

  const isFormPending = signupMutation.isPending || isUploadingPhoto;

  return (
    <div className="signup-page">
      <div className="signup-card">
        {step !== "success" && (
          <div className="signup-steps">
            <div
              className={`signup-step ${step === "form" ? "active" : "done"}`}
            >
              <span className="signup-step-dot">
                {step === "otp" ? <CheckCircle2 size={12} /> : "1"}
              </span>
              <span>Details</span>
            </div>
            <span className="signup-step-line" />
            <div className={`signup-step ${step === "otp" ? "active" : ""}`}>
              <span className="signup-step-dot">2</span>
              <span>Verify</span>
            </div>
          </div>
        )}

        {step === "otp" ? (
          /* ================= STEP 2: 6-DIGIT OTP ================= */
          <div>
            <div className="signup-logo signup-logo-otp">
              <KeyRound size={22} strokeWidth={2} />
            </div>
            <h1 className="signup-title">Enter Verification Code</h1>
            <p className="signup-subtitle">
              We sent a 6-digit code to{" "}
              <strong className="highlight-email">{pendingUser?.email}</strong>
            </p>

            <form onSubmit={handleVerifyOtp} style={{ marginTop: "24px" }}>
              <div className="field">
                {/* Header Row with Verification Code + Resend Button */}
                <div className="field-label-row">
                  <span className="field-label">Verification Code</span>
                  <button
                    type="button"
                    className="resend-code-btn"
                    onClick={handleResendOtp}
                    disabled={resendMutation.isPending || resendCooldown > 0}
                  >
                    {resendMutation.isPending ? (
                      <Loader2 size={12} className="spin" />
                    ) : (
                      <RotateCw size={12} />
                    )}
                    {resendCooldown > 0
                      ? `Resend Code (${formatTimer(resendCooldown)})`
                      : "Resend Code"}
                  </button>
                </div>

                {/* 6-Digit OTP Segmented Input */}
                <div className="otp-input-row">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      id={`signup-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="otp-box"
                      value={otp[i] || ""}
                      disabled={verifyOtpMutation.isPending}
                      autoFocus={i === 0}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const next = otp.split("");

                        if (val) {
                          next[i] = val.slice(-1);
                          setOtp(next.join("").slice(0, 6));

                          if (i < 5) {
                            const nextBox = document.getElementById(
                              `signup-otp-${i + 1}`,
                            );
                            if (nextBox) (nextBox as HTMLInputElement).focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          e.preventDefault();
                          const next = otp.split("");

                          if (otp[i]) {
                            next[i] = "";
                            setOtp(next.join(""));
                          } else if (i > 0) {
                            next[i - 1] = "";
                            setOtp(next.join(""));
                            const prevBox = document.getElementById(
                              `signup-otp-${i - 1}`,
                            );
                            if (prevBox) (prevBox as HTMLInputElement).focus();
                          }
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData
                          .getData("text")
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        if (pasted) {
                          setOtp(pasted);
                          const targetIndex = Math.min(pasted.length, 5);
                          const targetBox = document.getElementById(
                            `signup-otp-${targetIndex}`,
                          );
                          if (targetBox)
                            (targetBox as HTMLInputElement).focus();
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="signup-submit"
                disabled={verifyOtpMutation.isPending || otp.length !== 6}
                style={{ marginTop: "20px" }}
              >
                {verifyOtpMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Verifying code...
                  </>
                ) : (
                  "Verify & Complete"
                )}
              </button>
            </form>
          </div>
        ) : step === "success" ? (
          /* ================= STEP 3: SUCCESS ================= */
          <div style={{ textAlign: "center" }}>
            <div className="signup-logo">
              <CheckCircle2 size={24} style={{ color: "#16a34a" }} />
            </div>
            <h1 className="signup-title">Account Created!</h1>
            <p className="signup-subtitle">
              Your email has been verified. You can now log in.
            </p>
            <div className="verification-actions" style={{ marginTop: "24px" }}>
              <button
                type="button"
                className="goto-login-btn"
                onClick={() => navigate("/login")}
              >
                <span>Proceed to Log in</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* ================= STEP 1: SIGNUP FORM ================= */
          <>
            <div className="signup-logo">
              <CheckSquare size={20} strokeWidth={2} />
            </div>
            <h1 className="signup-title">Create your account</h1>
            <p className="signup-subtitle">
              Start tracking your projects in seconds.
            </p>

            <form
              className="signup-form"
              onSubmit={handleSubmit(onSubmit, () =>
                toast.error("Please fill in all fields correctly."),
              )}
              noValidate
            >
              {/* Photo */}
              <div className="field photo-field">
                <span className="field-label">
                  Profile Photo{" "}
                  <span className="field-label-optional">(optional)</span>
                </span>
                <div className="photo-upload-container">
                  <div className="photo-upload-wrapper">
                    <label
                      htmlFor="photo-input"
                      className="photo-preview-label"
                      tabIndex={0}
                    >
                      <div
                        className={`photo-preview ${
                          previewUrl ? "has-image" : ""
                        }`}
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="Avatar preview" />
                        ) : (
                          <div className="photo-placeholder-content">
                            <Camera size={26} className="camera-placeholder" />
                          </div>
                        )}
                        <div className="photo-preview-overlay">
                          <UploadCloud size={20} />
                          <span>{previewUrl ? "Change" : "Upload"}</span>
                        </div>
                      </div>
                    </label>

                    {previewUrl && (
                      <button
                        type="button"
                        className="photo-remove-btn"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                      >
                        &times;
                      </button>
                    )}

                    <input
                      id="photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                      disabled={isFormPending}
                    />
                  </div>
                  <div className="photo-upload-text">
                    <span className="photo-upload-title">
                      {selectedFile ? selectedFile.name : "Upload photo"}
                    </span>
                    <span className="photo-upload-hint">
                      PNG, JPG up to 5MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Name */}
              <label className="field">
                <span className="field-label">Name</span>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Enter your username"
                    {...register("name")}
                    disabled={isFormPending}
                  />
                </div>
                {errors.name && (
                  <small className="field-error">{errors.name.message}</small>
                )}
              </label>

              {/* Email */}
              <label className="field">
                <span className="field-label">Email</span>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    {...register("email")}
                    disabled={isFormPending}
                  />
                </div>
                {errors.email && (
                  <small className="field-error">{errors.email.message}</small>
                )}
              </label>

              {/* Password */}
              <label className="field">
                <span className="field-label">Password</span>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    {...register("password")}
                    disabled={isFormPending}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((curr) => !curr)}
                    disabled={isFormPending}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <small className="field-error">
                    {errors.password.message}
                  </small>
                )}
              </label>

              <button
                type="submit"
                className="signup-submit"
                disabled={isFormPending}
              >
                {isFormPending ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    {isUploadingPhoto
                      ? "Uploading photo..."
                      : "Sending code..."}
                  </>
                ) : (
                  "Sign up"
                )}
              </button>
            </form>

            <p className="signup-footer">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
