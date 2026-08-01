import {
  CheckSquare,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import "../css/Signup.css";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import useRegister from "../hooks/registerHook";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

type FormData = z.infer<typeof schema>;

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const signupMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    signupMutation.mutate(data, {
      onSuccess: () => {
        reset({ name: data.name, email: data.email, password: "" });
      },
    });
  };

  const errorMessage =
    (signupMutation.error as any)?.response?.data?.message ??
    "Error occurred during signup.";

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

        {signupMutation.isError && (
          <div className="form-banner form-banner-error">{errorMessage}</div>
        )}
        {signupMutation.isSuccess && (
          <div className="form-banner form-banner-success">
            Account created successfully!
          </div>
        )}

        <form
          className="signup-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <label className="field">
            <span className="field-label">Name</span>
            <div className="input-with-icon">
              <User size={16} className="input-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Aly Adel"
                autoComplete="name"
                {...register("name")}
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
                autoComplete="new-password"
                {...register("password")}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
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
            className="signup-submit"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? (
              <>
                <Loader2 size={16} className="spin" />
                Creating account...
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
