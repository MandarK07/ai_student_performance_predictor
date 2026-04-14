import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Lock, 
  BookOpen, 
  GraduationCap, 
  Loader2, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { signupUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import Button from "../components/ui/Button";

type Role = "teacher" | "student";

const roles: { id: Role; label: string; icon: typeof BookOpen; color: string; highlight: string }[] = [
  { 
    id: "teacher", 
    label: "Teacher", 
    icon: BookOpen, 
    color: "text-emerald-600", 
    highlight: "bg-emerald-600"
  },
  { 
    id: "student", 
    label: "Student", 
    icon: GraduationCap, 
    color: "text-rose-600", 
    highlight: "bg-rose-600"
  },
];

export default function RegisterUser() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [activeRole, setActiveRole] = useState<Role>("student");
  const [showPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const currentRoleConfig = roles.find(r => r.id === activeRole)!;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: any) => {
    setServerError(null);
    try {
      // 1. Signup
      await signupUser({
        full_name: data.fullName,
        username: data.username,
        email: data.email,
        password: data.password,
        role: activeRole,
      });

      setIsSuccess(true);

      // 2. Auto-login for seamless experience
      setTimeout(async () => {
        try {
          await login(data.username, data.password, activeRole);
          
          const roleTargets: Record<string, string> = {
            teacher: "/teacher-dashboard",
            student: "/student-dashboard"
          };
          
          navigate(roleTargets[activeRole], { replace: true });
        } catch (err) {
          // If auto-login fails, go to login page
          navigate("/login");
        }
      }, 1500);
      
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 selection:bg-brand-100 selection:text-brand-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[500px]"
      >
        {/* Header Section */}
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
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Account</h1>
          <p className="mt-2 text-slate-500">Join the academic performance platform</p>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft md:p-10">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Registration Successful!</h2>
                <p className="mt-2 text-slate-500 text-lg">Setting up your dashboard...</p>
                <Loader2 className="mt-8 h-8 w-8 animate-spin text-emerald-600" />
              </motion.div>
            ) : (
              <motion.div key="form">
                {/* Role Selector */}
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
                            layoutId="reg-role-highlight"
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

                  <div className="grid gap-5">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                      <div className="group relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-600 text-slate-400">
                          <User className="h-4.5 w-4.5" />
                        </div>
                        <input
                          {...register("fullName", { required: "Full name is required" })}
                          placeholder="John Doe"
                          className={cn(
                            "h-12 w-full rounded-2xl border bg-slate-50/50 pl-11 pr-4 text-sm outline-none transition-all focus:bg-white",
                            errors.fullName ? "border-red-300 focus:ring-red-500/10" : "border-slate-200 focus:ring-brand-500/10"
                          )}
                        />
                      </div>
                      {errors.fullName && <p className="text-xs font-medium text-red-500 ml-1">{errors.fullName.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {/* Username */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
                        <input
                          {...register("username", { required: "Username is required", minLength: { value: 3, message: "Min 3 chars" } })}
                          placeholder="johndoe"
                          className={cn(
                            "h-12 w-full rounded-2xl border bg-slate-50/50 px-4 text-sm outline-none transition-all focus:bg-white",
                            errors.username ? "border-red-300 focus:ring-red-500/10" : "border-slate-200 focus:ring-brand-500/10"
                          )}
                        />
                        {errors.username && <p className="text-xs font-medium text-red-500 ml-1">{errors.username.message}</p>}
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                        <input
                          {...register("email", { 
                            required: "Email is required",
                            pattern: { value: /^\S+@\S+$/i, message: "Invalid email" }
                          })}
                          placeholder="john@example.com"
                          className={cn(
                            "h-12 w-full rounded-2xl border bg-slate-50/50 px-4 text-sm outline-none transition-all focus:bg-white",
                            errors.email ? "border-red-300 focus:ring-red-500/10" : "border-slate-200 focus:ring-brand-500/10"
                          )}
                        />
                        {errors.email && <p className="text-xs font-medium text-red-500 ml-1">{errors.email.message}</p>}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                      <div className="group relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="h-4.5 w-4.5" />
                        </div>
                        <input
                          {...register("password", { 
                            required: "Password is required",
                            minLength: { value: 8, message: "Min 8 characters" }
                          })}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={cn(
                            "h-12 w-full rounded-2xl border bg-slate-50/50 pl-11 pr-4 text-sm outline-none transition-all focus:bg-white",
                            errors.password ? "border-red-300 focus:ring-red-500/10" : "border-slate-200 focus:ring-brand-500/10"
                          )}
                        />
                      </div>
                      {errors.password && <p className="text-xs font-medium text-red-500 ml-1">{errors.password.message}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Confirm Password</label>
                      <input
                        {...register("confirmPassword", { 
                          required: "Please confirm your password",
                          validate: (val: string) => val === password || "Passwords do not match"
                        })}
                        type="password"
                        placeholder="••••••••"
                        className={cn(
                          "h-12 w-full rounded-2xl border bg-slate-50/50 px-4 text-sm outline-none transition-all focus:bg-white",
                          errors.confirmPassword ? "border-red-300 focus:ring-red-500/10" : "border-slate-200 focus:ring-brand-500/10"
                        )}
                      />
                      {errors.confirmPassword && <p className="text-xs font-medium text-red-500 ml-1">{errors.confirmPassword.message}</p>}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "mt-4 h-12 w-full rounded-2xl text-base font-bold transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg active:translate-y-0 text-white",
                      currentRoleConfig.highlight
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Create {activeRole === 'teacher' ? 'Teacher' : 'Student'} Account
                        <ChevronRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <p className="text-sm text-slate-500">
                      Already have an account?{" "}
                      <Link to="/login" className="font-semibold text-slate-700 hover:text-brand-600 transition">
                        Sign In
                      </Link>
                    </p>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
