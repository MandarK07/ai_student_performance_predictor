import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { 
  createInvite, 
  previewInvite, 
  getAllLinkingRequests,
  approveLinkingRequest,
  rejectLinkingRequest,
  type InvitePreviewResponse,
  type LinkingRequest
} from "../api/enrollments";
import { Clock, CheckCircle2, XCircle, UserPlus, ClipboardList } from "lucide-react";
import { cn } from "../lib/utils";

export default function Invites() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create' | 'requests'>('create');
  const [email, setEmail] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [link, setLink] = useState("");
  const [preview, setPreview] = useState<InvitePreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [requests, setRequests] = useState<LinkingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'requests') {
       fetchRequests();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await getAllLinkingRequests('pending');
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApprove = async (requestId: string, email: string, code: string | null) => {
     setResolvingId(requestId);
     try {
       const previewData = await previewInvite({ email, student_code: code || undefined });
       await approveLinkingRequest(requestId, previewData.linked_student.student_id, "Manually approved linking request.");
       fetchRequests();
     } catch (err) {
       window.alert(err instanceof Error ? err.message : "Failed to approve request");
     } finally {
       setResolvingId(null);
     }
  };

  const handleReject = async (requestId: string) => {
     if (!window.confirm("Are you sure you want to reject this request?")) return;
     setResolvingId(requestId);
     try {
       await rejectLinkingRequest(requestId, "Request rejected by administrator.");
       fetchRequests();
     } catch (err) {
       window.alert(err instanceof Error ? err.message : "Failed to reject request");
     } finally {
       setResolvingId(null);
     }
  };

  const clearGeneratedState = () => {
    setPreview(null);
    setLink("");
    setError(null);
  };

  const invitePayload = {
    email,
    student_code: studentCode || undefined,
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setError(null);
    setLink("");
    try {
      const response = await previewInvite(invitePayload);
      setPreview(response);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Failed to match student record");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!preview) {
      setError("Check the student match before generating an invite.");
      return;
    }

    setLoading(true);
    setError(null);
    setLink("");
    try {
      const res = await createInvite(invitePayload);
      setPreview({ matched_by: res.matched_by, linked_student: res.linked_student });
      const inviteLink = `${window.location.origin}/enroll/${res.token}`;
      setLink(inviteLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Enrollment</h1>
        <p className="text-sm text-slate-500">Manage student onboarding and account linking.</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('create')}
          className={cn(
            "px-6 py-3 text-sm font-semibold transition-all border-b-2",
            activeTab === 'create' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Create Invite
          </div>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={cn(
            "px-6 py-3 text-sm font-semibold transition-all border-b-2",
            activeTab === 'requests' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Manual Requests
            {requests.length > 0 && <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">{requests.length}</span>}
          </div>
        </button>
      </div>

      {activeTab === 'create' ? (
        <Card className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Student Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                value={email}
                placeholder="student@example.com"
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearGeneratedState();
                }}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Student Code (optional)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                value={studentCode}
                placeholder="STU-12345"
                onChange={(e) => {
                  setStudentCode(e.target.value);
                  clearGeneratedState();
                }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={handlePreview} disabled={previewLoading || loading || !email} variant="secondary">
              {previewLoading ? "Checking..." : "Verify Student Record"}
            </Button>
            <Button onClick={handleCreate} disabled={loading || previewLoading || !email || !preview} className="w-full md:w-auto">
            {loading ? "Creating..." : "Generate & Copy Invite Link"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {preview && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                 <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                 <div>
                    <p className="font-bold text-emerald-900">Student Match Confirmed</p>
                    <p className="mt-1 text-emerald-800">
                      {preview.linked_student.full_name} • {preview.linked_student.student_code}
                    </p>
                    <p className="text-emerald-700 text-xs mt-1">
                      Matched by {preview.matched_by === "student_code" ? "student code" : "email"}.
                    </p>
                 </div>
              </div>
            </div>
          )}
          {link && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="font-bold text-indigo-900 mb-2">Invite Link Generated</p>
              <div className="flex gap-2">
                <input readOnly value={link} className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-mono" />
                <Button size="sm" onClick={() => {
                  navigator.clipboard.writeText(link);
                  window.alert("Link copied to clipboard!");
                }}>Copy</Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden divide-y divide-slate-100">
           {loadingRequests ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                Loading pending requests...
              </div>
           ) : requests.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 opacity-20" />
                </div>
                <p className="font-semibold text-slate-900">No Pending Requests</p>
                <p className="text-sm">There are no student linking requests waiting for review.</p>
              </div>
           ) : (
             requests.map((req) => (
                <div key={req.request_id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                   <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                         <Clock className="h-6 w-6" />
                      </div>
                      <div>
                         <p className="font-bold text-slate-900">{req.full_name || 'Generic Student'}</p>
                         <p className="text-sm text-slate-500">{req.email}</p>
                         <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                               Code: {req.student_code || 'Not Provided'}
                            </span>
                            <span className="text-xs text-slate-400">
                               Requested {new Date(req.created_at).toLocaleDateString()}
                            </span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => handleReject(req.request_id)}
                        disabled={resolvingId === req.request_id}
                      >
                         <XCircle className="h-4 w-4 mr-2" />
                         Reject
                      </Button>
                      <Button 
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/students?create=true&email=${encodeURIComponent(req.email)}&student_code=${encodeURIComponent(req.student_code || "")}&full_name=${encodeURIComponent(req.full_name || "")}`)}
                      >
                         <UserPlus className="h-4 w-4 mr-2" />
                         Create Record
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleApprove(req.request_id, req.email, req.student_code)}
                        disabled={resolvingId === req.request_id}
                      >
                         {resolvingId === req.request_id ? "Processing..." : "Approve & Link"}
                      </Button>
                   </div>
                </div>
             ))
           )}
        </Card>
      )}
    </div>
  );
}
