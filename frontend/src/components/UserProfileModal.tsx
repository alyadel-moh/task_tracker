import { useEffect, useRef, useState } from "react";
import {
  X,
  Pencil,
  Trash2,
  UserCog,
  User as UserIcon,
  Mail,
  KeyRound,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import InlineEditField from "./InlineEditField";
import useUpdateUser from "../hooks/updateUserHook";
import { useVerifyUpdatedEmailOtp } from "../hooks/verifyUpdatedEmailHook";
import { uploadImageToCloudinary } from "../hooks/UploadPhoto";
import "../css/UserProfileModal.css";
import { User } from "./types";

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
}

const UserProfileModal = ({ user, onClose }: UserProfileModalProps) => {
  // 1. Declare ALL hooks at the top level unconditionally
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateUserMutation = useUpdateUser();
  const verifyUpdatedEmailMutation = useVerifyUpdatedEmailOtp();

  const [userDraft, setUserDraft] = useState<User>({
    id: user?.id ?? "",
    name: user?.name ?? "",
    email: user?.email ?? "",
    photoUrl: user?.photoUrl ?? null,
  });

  // OTP Verification States
  const [showOtpPrompt, setShowOtpPrompt] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState("");
  const [emailOtpToken, setEmailOtpToken] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync draft whenever user prop changes
  useEffect(() => {
    if (user) {
      setUserDraft({
        id: user.id,
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl ?? null,
      });
    }
  }, [user]);

  useEffect(() => {
    setImgError(false);
  }, [userDraft.photoUrl]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showOtpPrompt) {
          setShowOtpPrompt(false);
          setOtp("");
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showOtpPrompt]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 2. Early return strictly after all hook declarations
  if (!user) return null;

  const getInitials = (str?: string | null) => {
    if (!str) return "U";
    return str
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAutoSave = (updatedFields: Partial<User>) => {
    const isEmailChange =
      updatedFields.email !== undefined &&
      updatedFields.email.trim() !== user.email;

    const payload: Partial<User> = {};
    if (updatedFields.name !== undefined)
      payload.name = updatedFields.name.trim();
    if (updatedFields.photoUrl !== undefined)
      payload.photoUrl = updatedFields.photoUrl;
    if (isEmailChange) payload.email = updatedFields.email!.trim();

    updateUserMutation.mutate(payload as any, {
      onSuccess: (res: any) => {
        if (res?.requiresEmailVerification) {
          setPendingNewEmail(res.pendingEmail);
          setEmailOtpToken(res.emailVerificationToken);
          setShowOtpPrompt(true);
          setOtp("");
          setResendCooldown(900);
          toast.success("Verification code sent to your new email!");
        } else {
          const backendMessage = res?.message || "Profile updated successfully";
          toast.success(backendMessage, { id: "user-update" });
        }
      },
      onError: (err: any) => {
        setUserDraft({
          id: user.id,
          name: user.name,
          email: user.email,
          photoUrl: user.photoUrl ?? null,
        });
        toast.error(
          err?.response?.data?.message || "Failed to update profile",
          { id: "user-update" },
        );
      },
    });
  };

  const handleVerifyEmailOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6 || !pendingNewEmail) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    verifyUpdatedEmailMutation.mutate(
      {
        newEmail: pendingNewEmail,
        otp: otp.trim(),
        token: emailOtpToken,
      },
      {
        onSuccess: () => {
          toast.success("Email updated successfully!");
          setUserDraft((prev) => ({ ...prev, email: pendingNewEmail }));
          setShowOtpPrompt(false);
          setOtp("");
          setEmailOtpToken("");
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message ||
              "Invalid or expired verification code",
          );
        },
      },
    );
  };

  const handleResendEmailOtp = () => {
    if (resendCooldown > 0 || !pendingNewEmail) return;

    updateUserMutation.mutate({ email: pendingNewEmail } as any, {
      onSuccess: (res: any) => {
        if (res?.emailVerificationToken) {
          setEmailOtpToken(res.emailVerificationToken);
        }
        setResendCooldown(900);
        toast.success("New verification code sent!");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to resend code.");
      },
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadedUrl = await uploadImageToCloudinary(file);
      setUserDraft((prev) => ({ ...prev, photoUrl: uploadedUrl }));
      handleAutoSave({ photoUrl: uploadedUrl });
      setImgError(false);
    } catch {
      toast.error("Failed to upload profile photo");
    }
  };

  const handleDeletePhoto = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUserDraft((prev) => ({ ...prev, photoUrl: null }));
    handleAutoSave({ photoUrl: null });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card user-profile-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: "none" }}
        />

        {showOtpPrompt ? (
          /* ================= EMAIL OTP VERIFICATION VIEW ================= */
          <div style={{ textAlign: "center" }}>
            <div className="signup-logo signup-logo-otp">
              <KeyRound size={22} strokeWidth={2} />
            </div>
            <h1 className="signup-title">Enter Verification Code</h1>
            <p className="signup-subtitle">
              We sent a 6-digit code to{" "}
              <strong className="highlight-email">{pendingNewEmail}</strong>
            </p>

            <form onSubmit={handleVerifyEmailOtp} style={{ marginTop: "24px" }}>
              <div className="otp-input-row">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    id={`update-email-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-box"
                    value={otp[i] || ""}
                    disabled={verifyUpdatedEmailMutation.isPending}
                    autoFocus={i === 0}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const next = otp.split("");

                      if (val) {
                        next[i] = val.slice(-1);
                        setOtp(next.join("").slice(0, 6));

                        // Auto-focus next box
                        if (i < 5) {
                          const nextBox = document.getElementById(
                            `update-email-otp-${i + 1}`,
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
                            `update-email-otp-${i - 1}`,
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
                        // Focus the box corresponding to paste length or the last box
                        const targetIndex = Math.min(pasted.length, 5);
                        const targetBox = document.getElementById(
                          `update-email-otp-${targetIndex}`,
                        );
                        if (targetBox) (targetBox as HTMLInputElement).focus();
                      }
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpPrompt(false);
                    setOtp("");
                    setUserDraft((prev) => ({ ...prev, email: user.email }));
                  }}
                  className="resend-btn"
                  style={{ flex: 1, height: "42px" }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="signup-submit"
                  disabled={
                    verifyUpdatedEmailMutation.isPending || otp.length !== 6
                  }
                  style={{ flex: 1, marginTop: 0, height: "42px" }}
                >
                  {verifyUpdatedEmailMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Update"
                  )}
                </button>
              </div>
            </form>

            <div className="verification-actions" style={{ marginTop: "18px" }}>
              <button
                type="button"
                className="resend-btn"
                onClick={handleResendEmailOtp}
                disabled={updateUserMutation.isPending || resendCooldown > 0}
              >
                {updateUserMutation.isPending ? (
                  <Loader2 size={15} className="spin" />
                ) : resendCooldown > 0 ? (
                  `Resend code in ${Math.ceil(resendCooldown / 60)} mins`
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Resend code
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ================= MAIN PROFILE FORM ================= */
          <>
            <div className="modal-header">
              <div className="modal-header-icon">
                <UserCog size={18} aria-hidden="true" />
              </div>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>

            <h2 id="user-profile-title" className="modal-title">
              Account Settings
            </h2>
            <p className="modal-subtitle">
              Manage your personal details and avatar profile picture.
            </p>

            {/* Avatar Section */}
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                {userDraft.photoUrl && !imgError ? (
                  <img
                    src={userDraft.photoUrl}
                    alt={userDraft.name}
                    className="profile-avatar-img"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="profile-avatar-fallback">
                    {getInitials(userDraft.name)}
                  </div>
                )}

                <button
                  type="button"
                  className="avatar-action-btn avatar-edit-btn"
                  onClick={() => fileInputRef.current?.click()}
                  data-tooltip="Change Photo"
                  data-tooltip-pos="right"
                  aria-label="Change Photo"
                >
                  <Pencil size={13} className="avatar-icon" />
                </button>

                {userDraft.photoUrl && (
                  <button
                    type="button"
                    className="avatar-action-btn avatar-delete-btn"
                    onClick={handleDeletePhoto}
                    aria-label="Delete Photo"
                    data-tooltip="Delete Photo"
                    data-tooltip-pos="left"
                  >
                    <Trash2 size={13} className="avatar-icon" />
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="modal-form">
              {/* Name Field */}
              <div className="field">
                <span
                  className="field-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <UserIcon
                    size={15}
                    style={{ flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <span>Name</span>
                </span>
                <InlineEditField
                  value={userDraft.name}
                  type="text"
                  placeholder="Enter your full name..."
                  onSave={(value) => {
                    setUserDraft((prev) => ({ ...prev, name: value }));
                    handleAutoSave({ name: value });
                  }}
                />
              </div>

              {/* Email Field */}
              <div className="field">
                <span
                  className="field-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <Mail
                    size={15}
                    style={{ flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <span>Email address</span>
                </span>
                <InlineEditField
                  value={userDraft.email}
                  type="text"
                  placeholder="Enter your email address..."
                  onSave={(value) => {
                    handleAutoSave({ email: value });
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
