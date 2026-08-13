import { useState } from "react";
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
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import "../css/Signup.css";
import useRegister from "../hooks/registerHook";
import { uploadImageToCloudinary } from "../hooks/UploadPhoto";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

type FormData = z.infer<typeof schema>;

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const signupMutation = useRegister();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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

      signupMutation.mutate(
        { ...data, photoUrl },
        {
          onSuccess: () => {
            toast.success("Account created successfully!");
            reset();
            setPreviewUrl(null);
            setSelectedFile(null);
            navigate("/login");
          },
          onError: (error: any) => {
            const message =
              error?.response?.data?.message ?? "Error occurred during signup.";
            toast.error(message);
          },
        },
      );
    } catch (_uploadError) {
      toast.error("Failed to upload profile photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const onInvalid = () => {
    toast.error("Please fill in all required fields correctly.");
  };

  const isPending = signupMutation.isPending || isUploadingPhoto;

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-logo">
          <CheckSquare size={20} strokeWidth={2} />
        </div>

        <h1 className="signup-title">Create your account</h1>
        <p className="signup-subtitle">
          Start tracking your projects in seconds.
        </p>

        <form
          className="signup-form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
        >
          {/* Profile Photo Field */}
          <div className="field photo-field">
            <span className="field-label">Profile Photo (Optional)</span>
            <div className="photo-upload-wrapper">
              <div className="photo-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar preview" />
                ) : (
                  <Camera size={24} className="camera-placeholder" />
                )}
              </div>

              <label htmlFor="photo-input" className="photo-upload-btn">
                <UploadCloud size={16} />
                <span>{selectedFile ? "Change Photo" : "Upload Photo"}</span>
              </label>

              <input
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
                disabled={isPending}
              />
            </div>
          </div>

          <label className="field">
            <span className="field-label">Name</span>
            <div className="input-with-icon">
              <User size={16} className="input-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Enter your username"
                {...register("name")}
                disabled={isPending}
              />
            </div>
            {errors.name && (
              <small className="field-error">{errors.name.message}</small>
            )}
          </label>

          <label className="field">
            <span className="field-label">Email</span>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" aria-hidden="true" />
              <input
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                {...register("email")}
                disabled={isPending}
              />
            </div>
            {errors.email && (
              <small className="field-error">{errors.email.message}</small>
            )}
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                {...register("password")}
                disabled={isPending}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
                disabled={isPending}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <small className="field-error">{errors.password.message}</small>
            )}
          </label>

          <button type="submit" className="signup-submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 size={16} className="spin" />
                {isUploadingPhoto
                  ? "Uploading photo..."
                  : "Creating account..."}
              </>
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        <p className="signup-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
