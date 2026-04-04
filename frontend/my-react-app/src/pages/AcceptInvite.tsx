import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { acceptInvite, getInviteStatus } from "../api/enrollments";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export default function AcceptInvite() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentCode, setStudentCode] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const s = await getInviteStatus(token);
        setStatus(s);
        setFirstName(s.first_name || "");
        setLastName(s.last_name || "");
        setStudentCode(s.student_code || "");
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
      await acceptInvite({ token, first_name: firstName || undefined, last_name: lastName || undefined, student_code: studentCode || undefined });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading invite...</div>;
  if (error) return <div className="flex min-h-screen items-center justify-center text-red-600">{error}</div>;

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
            <label className="text-xs text-slate-600">First Name</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-600">Last Name</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-600">Student Code (optional)</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={studentCode} onChange={(e) => setStudentCode(e.target.value)} />
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
