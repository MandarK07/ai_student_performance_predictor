import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  BookOpen, 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import Button from "../components/ui/Button";

type Role = "admin" | "teacher" | "student";

const roles: { id: Role; label: string; icon: typeof Shield; color: string; bgColor: string; borderColor: string; highlight: string }[] = [
  { 
    id: "admin", 
    label: "Admin", 
    icon: Shield, 
    color: "text-indigo-600", 
    bgColor: "bg-indigo-50", 
    borderColor: "border-indigo-200",
    highlight: "bg-indigo-600"
  },
  { 
    id: "teacher", 
    label: "Teacher", 
    icon: BookOpen, 
    color: "text-emerald-600", 
    bgColor: "bg-emerald-50", 
    borderColor: "border-emerald-200",
    highlight: "bg-emerald-600"
  },
  { 
    id: "student", 
    label: "Student", 
    icon: GraduationCap, 
    color: "text-rose-600", 
    bgColor: "bg-rose-50", 
    borderColor: "border-rose-200",
    highlight: "bg-rose-600"
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  const [activeRole, setActiveRole] = useState<Role>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const currentRoleConfig = roles.find(r => r.id === activeRole)!;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      usernameOrEmail: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: any) => {
    setServerError(null);
    try {
      const me = await login(data.usernameOrEmail, data.password, activeRole);
      
      const roleTargets: Record<string, string> = {
        admin: "/admin-dashboard",
        teacher: "/teacher-dashboard",
        student: "/student-dashboard"
      };
      
      const target = roleTargets[me.role] || "/dashboard";
      navigate(from !== "/dashboard" ? from : target, { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Authentication failed. Please check your credentials.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 selection:bg-brand-100 selection:text-brand-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[440px]"
      >
        {/* Logo / Title Section */}
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-soft"
          >
            <div className={cn("h-10 w-10 transition-colors duration-300", currentRoleConfig.color)}>
              <currentRoleConfig.icon className="h-full w-full" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome Back</h1>
          <p className="mt-2 text-slate-500">Sign in to your academic portal</p>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft md:p-10">
          {/* Background Decorative Element */}
          <div className={cn(
            "absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-[0.03] transition-colors duration-500",
            currentRoleConfig.highlight
          )} />

          {/* Role selector Tabs */}
          <div className="mb-8 flex rounded-2xl bg-slate-100 p-1">
            {roles.map((role) => {
              const isActive = activeRole === role.id;
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setActiveRole(role.id)}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none",
                    isActive ? "text-white" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="role-highlight"
                      className={cn("absolute inset-0 rounded-xl", role.highlight)}
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={cn("relative z-10 h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                  <span className="relative z-10">{role.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600"
                >
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{serverError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {/* Username/Email Field */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1" htmlFor="usernameOrEmail">
                  User Account
                </label>
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-600 text-slate-400">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <input
                    {...register("usernameOrEmail", { 
                      required: "Please enter your username or email",
                      minLength: { value: 3, message: "Username must be at least 3 characters" }
                    })}
                    id="usernameOrEmail"
                    placeholder="Enter your email or username"
                    className={cn(
                      "h-12 w-full rounded-2xl border bg-slate-50/50 pl-11 pr-4 text-sm outline-none transition-all focus:bg-white",
                      errors.usernameOrEmail 
                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
                        : "border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                    )}
                  />
                </div>
                {errors.usernameOrEmail && (
                  <p className="text-xs font-medium text-red-500 ml-1 mt-1">{errors.usernameOrEmail.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition">
                    Forgot Password?
                  </a>
                </div>
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-600 text-slate-400">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <input
                    {...register("password", { 
                      required: "Password is required",
                      minLength: { value: 1, message: "Please enter your password" }
                    })}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(
                      "h-12 w-full rounded-2xl border bg-slate-50/50 pl-11 pr-12 text-sm outline-none transition-all focus:bg-white",
                      errors.password 
                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
                        : "border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-red-500 ml-1 mt-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2 group cursor-pointer w-fit px-1">
              <div className="relative flex items-center justify-center h-5 w-5 rounded-md border border-slate-300 bg-white group-hover:border-brand-400 transition-colors">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="peer absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="h-3 w-3 rounded-sm bg-brand-600 opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-sm text-slate-600 select-none">Remember this device</span>
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "h-12 w-full rounded-2xl text-base font-bold transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg active:translate-y-0",
                currentRoleConfig.highlight
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In to Portal
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Social / Footer */}
          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link to="/register-user" className="font-semibold text-slate-700 hover:text-brand-600 transition">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
