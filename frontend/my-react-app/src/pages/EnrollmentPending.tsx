import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import { 
  UserCheck, 
  UserX, 
  Mail, 
  LogOut, 
  MessageCircle,
  Activity,
  ExternalLink,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getMyLinkingRequest, requestLinking, type LinkingRequest } from "../api/enrollments";

const EnrollmentPending = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [pendingReq, setPendingReq] = useState<LinkingRequest | null>(null);
  const [loadingReq, setLoadingReq] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [studentCodeInput, setStudentCodeInput] = useState("");

  useEffect(() => {
    const fetchReq = async () => {
      try {
        const req = await getMyLinkingRequest();
        setPendingReq(req);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingReq(false);
      }
    };
    fetchReq();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleEnrollWithToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      navigate(`/enroll/${token.trim()}`);
    }
  };

  const handleRequestLink = async () => {
    setIsRequesting(true);
    try {
      const newReq = await requestLinking(studentCodeInput || undefined);
      setPendingReq(newReq);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 selection:bg-indigo-100 dark:bg-slate-900">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900/50 dark:backdrop-blur-xl">
        <div className="relative h-2 bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-600"></div>
        
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <UserCheck className="h-10 w-10" />
            </div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Enrollment Pending
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Your account is active, but we need to link you to a student record.
            </p>
          </div>

          {/* Status Cards */}
          <div className="mb-10 grid gap-4 md:grid-cols-2">
            <div className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-teal-200 hover:bg-teal-50/30 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:border-teal-500/30">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">Account Status</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></div>
                <span className="text-sm font-medium text-teal-600 dark:text-teal-400">Account Active</span>
              </div>
            </div>

            <div className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-amber-200 hover:bg-amber-50/30 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:border-amber-500/30">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <UserX className="h-4 w-4" />
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">Student Link</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Not Linked Yet</span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-10 rounded-2xl bg-indigo-50/50 p-6 dark:bg-indigo-500/5">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm dark:bg-slate-800">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Registered Email</h4>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{user?.email}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Admins will use this email to find your student record. If they've already created it using a different email, you might need to use an enrollment link.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            <form onSubmit={handleEnrollWithToken} className="relative">
              <label htmlFor="token" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Have an enrollment token?
              </label>
              <div className="relative">
                <input
                  id="token"
                  type="text"
                  placeholder="Enter enrollment token..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-4 pr-32 text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!token.trim()}
                  className="absolute right-2 top-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50 dark:shadow-none"
                >
                  Apply Link
                </button>
              </div>
            </form>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={async () => {
                  await refreshUser();
                  const req = await getMyLinkingRequest();
                  setPendingReq(req);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Activity className="h-4 w-4" />
                Check Status
              </button>
              <button
                onClick={() => window.alert("Support contact functionality coming soon. Please contact your campus administrator.")}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Help
              </button>
            </div>

            {/* Manual Linking Request Section */}
            <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/20 p-6 dark:border-indigo-500/20 dark:bg-indigo-500/5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <ClipboardList className="h-5 w-5 text-indigo-500" />
                Manual Link Request
              </h3>
              
              {loadingReq ? (
                <div className="flex animate-pulse items-center gap-2 text-sm text-slate-400">
                  <Clock className="h-4 w-4" />
                  Checking for pending requests...
                </div>
              ) : pendingReq ? (
                <div className={cn(
                  "rounded-xl border p-4",
                  pendingReq.status === 'pending' ? "border-amber-100 bg-amber-50/50 text-amber-800" :
                  pendingReq.status === 'approved' ? "border-emerald-100 bg-emerald-50/50 text-emerald-800" :
                  "border-red-100 bg-red-50/50 text-red-800"
                )}>
                  <div className="flex items-center gap-3">
                    {pendingReq.status === 'pending' ? <Clock className="h-5 w-5" /> :
                     pendingReq.status === 'approved' ? <CheckCircle2 className="h-5 w-5" /> :
                     <AlertCircle className="h-5 w-5" />}
                    <div>
                      <p className="text-sm font-bold capitalize">Request {pendingReq.status}</p>
                      <p className="text-xs opacity-80">
                        Submitted: {new Date(pendingReq.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {pendingReq.status === 'pending' && (
                    <p className="mt-2 text-xs">
                      An administrator has been notified. They will review your request and link your account soon.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    If you don't have a token, you can request an administrator to manually verify and link your account.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Student Code (Optional)"
                      value={studentCodeInput}
                      onChange={(e) => setStudentCodeInput(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-800"
                    />
                    <button
                      onClick={handleRequestLink}
                      disabled={isRequesting}
                      className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isRequesting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
              
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <ExternalLink className="h-3 w-3" />
                <span>Visit Help Center</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentPending;
