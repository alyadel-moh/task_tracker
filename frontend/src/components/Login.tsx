import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckSquare, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import useLogin from "../hooks/loginHook";
import "../css/Login.css";
import { Link, useNavigate } from "react-router-dom";

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type FormData = z.infer<typeof schema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Welcome back!");
        navigate("/projects");
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ?? "Invalid email or password.";
        toast.error(message);
      },
    });
  };

  const onInvalid = () => {
    toast.error("Please fix the errors in the form.");
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
          onSubmit={handleSubmit(onSubmit, onInvalid)}
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
            <span className="field-label">Password</span>
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
    </div>
  );
};

export default Login;
