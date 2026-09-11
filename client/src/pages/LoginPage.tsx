import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import { getDashboardPath } from "../utils";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 7 11 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.52 13.52 0 0 0 1 12s4 7 11 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const from = (location.state as { from?: { pathname: string } })?.from
    ?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      navigate(from || getDashboardPath(user.role));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-surface-900">Welcome back</h1>
          <p className="mt-2 text-sm text-surface-700">
            Sign in to your Gigverse account
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
<div className="relative">
  <Input
    label="Password"
    type={showPassword ? "text" : "password"}
    error={errors.password?.message}
    className="pr-12"
    {...register("password")}
  />

  <button
    type="button"
    onClick={() => setShowPassword((v) => !v)}
    aria-label={showPassword ? "Hide password" : "Show password"}
    className="
      group absolute right-2 top-11 z-10
      flex h-8 w-8 -translate-y-1/2
      items-center justify-center
      rounded-md
      text-surface-500
      transition-colors duration-200
      hover:bg-surface-800 hover:text-surface-200
      focus:outline-none focus:ring-2 focus:ring-primary-500/50
    "
  >
    {showPassword ? <EyeIcon /> : <EyeOffIcon />}

    <span
      className="
        pointer-events-none absolute
        bottom-full left-1/2 mb-2
        -translate-x-1/2
        whitespace-nowrap rounded-md
        bg-surface-900 px-2.5 py-1.5
        text-xs font-medium text-black
        opacity-0 shadow-lg
        transition-opacity duration-150
        group-hover:opacity-100
      "
    >
      {showPassword ? "Hide password" : "Show password"}
    </span>
  </button>
</div>
          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-surface-700">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary-400 hover:text-primary-300 font-medium"
          >
            Sign up
          </Link>
        </p>
        <div className="mt-4 p-3 bg-surface-50 rounded-lg text-xs text-surface-700">
          <p className="font-medium text-surface-800 mb-1">Demo accounts:</p>
          <p>Freelancer: freelancer@campusconnection.com</p>
          <p>Client: client@campusconnection.com</p>
          <p>Password: password@123</p>
        </div>
      </Card>
    </div>
  );
}
