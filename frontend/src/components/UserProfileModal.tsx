/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useRef, useState } from "react";
import { X, Pencil, Trash2, UserCog } from "lucide-react";
import { toast } from "react-hot-toast";
import InlineEditField from "./InlineEditField";
import useUpdateUser from "../hooks/updateUserHook";
import { uploadImageToCloudinary } from "../hooks/UploadPhoto";
import "../css/UserProfileModal.css";
import { User } from "./types";

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
  onUpdateProfile?: (user: User) => Promise<void> | void;
}

const UserProfileModal = ({
  user,
  onClose,
  onUpdateProfile,
}: UserProfileModalProps) => {
  if (!user) return null;

  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateUserMutation = useUpdateUser();
  const [userDraft, setUserDraft] = useState<User>({
    id: user.id,
    name: user.name,
    email: user.email,
    photoUrl: user.photoUrl ?? null,
  });

  useEffect(() => {
    setImgError(false);
  }, [userDraft.photoUrl]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
    const updatedUserPayload: User = {
      id: user.id,
      name: (updatedFields.name ?? userDraft.name ?? user.name ?? "").trim(),
      email: (
        updatedFields.email ??
        userDraft.email ??
        user.email ??
        ""
      ).trim(),
      photoUrl:
        updatedFields.photoUrl !== undefined
          ? updatedFields.photoUrl
          : (userDraft.photoUrl ?? user.photoUrl ?? null),
    };

    updateUserMutation.mutate(
      {
        name: updatedUserPayload.name,
        email: updatedUserPayload.email,
        photoUrl: updatedUserPayload.photoUrl,
      },
      {
        onSuccess: (res: any) => {
          const backendMessage = res?.message || res?.data?.message;
          toast.success(backendMessage || "Profile updated successfully", {
            id: "user-update",
          });
          if (onUpdateProfile) {
            onUpdateProfile(updatedUserPayload);
          }
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || "Failed to update profile",
            { id: "user-update" },
          );
        },
      },
    );
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

        {/* Header Section */}
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

        {/* Centered Avatar Section */}
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

            {/* Edit Photo Icon */}
            <button
              type="button"
              className="avatar-action-btn avatar-edit-btn"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              title="Change Photo"
              aria-label="Change Photo"
            >
              <Pencil size={13} className="avatar-icon" />
            </button>

            {/* Delete Photo Icon */}
            {userDraft.photoUrl && (
              <button
                type="button"
                className="avatar-action-btn avatar-delete-btn"
                onClick={handleDeletePhoto}
                title="Delete Photo"
                aria-label="Delete Photo"
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
            <span className="field-label">Name</span>
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
            <span className="field-label">Email address</span>
            <InlineEditField
              value={userDraft.email}
              type="text"
              placeholder="Enter your email address..."
              onSave={(value) => {
                setUserDraft((prev) => ({ ...prev, email: value }));
                handleAutoSave({ email: value });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
