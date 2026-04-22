import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { acceptInvite, getInviteStatus, type InviteStatus } from "../api/enrollments";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export default function AcceptInvite() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState<InviteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const s = await getInviteStatus(token);
        setStatus(s);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invite invalid");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [token]);

  const handleAccept = async () => {
    setError(null);
    try {
      await acceptInvite({ token });
      await refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading invite...</div>;
  if (error) return <div className="flex min-h-screen items-center justify-center text-red-600">{error}</div>;
  if (!status) return <div className="flex min-h-screen items-center justify-center text-red-600">Invite details are unavailable.</div>;

  if (!user || user.role !== "student") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <h1 className="text-xl font-semibold text-slate-900">Login required</h1>
          <p className="mt-2 text-sm text-slate-600">Please log in with the invited email ({status.email}) to accept your enrollment.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-lg space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accept Enrollment Invite</h1>
          <p className="text-sm text-slate-600">Invited email: {status.email}</p>
          <p className="text-xs text-slate-500">Expires: {new Date(status.expires_at).toLocaleString()}</p>
        </div>

        <div className="grid gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Student Code</p>
            <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {status.student_code || "Not specified on invite"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Student Name</p>
            <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {[status.first_name, status.last_name].filter(Boolean).join(" ") || "Provided by your admin or teacher"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Linking Rule</p>
            <p className="mt-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              This invite can only link to an existing student record. If no matching student exists, ask your admin or teacher to upload or correct it first.
            </p>
          </div>
        </div>

        <Button onClick={handleAccept} className="w-full">
          Accept Invite
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </Card>
    </div>
  );
}
