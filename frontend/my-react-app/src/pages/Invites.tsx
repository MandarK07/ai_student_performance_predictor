import { useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { createInvite } from "../api/enrollments";

export default function Invites() {
  const [email, setEmail] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setLink("");
    try {
      const res = await createInvite({
        email,
        student_code: studentCode || undefined,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });
      const inviteLink = `${window.location.origin}/enroll/${res.token}`;
      setLink(inviteLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Student Invite</h1>
        <p className="text-sm text-slate-500">Generate an invite link to onboard students and link their profiles.</p>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500">Student Email</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Student Code (optional)</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={studentCode} onChange={(e) => setStudentCode(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-500">First Name (optional)</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Last Name (optional)</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleCreate} disabled={loading || !email} className="w-full md:w-auto">
          {loading ? "Creating..." : "Generate Invite"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {link && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-slate-900">Invite Link</p>
            <p className="break-all text-slate-700">{link}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
