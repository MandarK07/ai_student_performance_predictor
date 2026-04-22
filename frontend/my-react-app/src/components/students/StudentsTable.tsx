import { useMemo, useState } from "react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { Eye, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "../../api/http";

export type StudentRisk = "Low" | "Medium" | "High" | "Critical" | "Unknown";

export type StudentRow = {
  studentCode: string;
  name: string;
  email: string;
  status: string;
  predictedGpa: number | null;
  attendance: number | null;
  risk: StudentRisk;
};

type StudentsTableProps = {
  rows: StudentRow[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  canDelete?: boolean;
};

function riskVariant(risk: StudentRisk): "low" | "medium" | "high" {
  if (risk === "High" || risk === "Critical") return "high";
  if (risk === "Medium") return "medium";
  return "low";
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)}%`;
}

function formatGpa(value: number | null): string {
  if (value === null || value === undefined) return "N/A";
  return value.toFixed(2);
}

export default function StudentsTable({
  rows,
  loading = false,
  error = null,
  onRefresh,
  canDelete = false,
}: StudentsTableProps) {
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<StudentRisk | "All">("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // View modal
  const [viewStudent, setViewStudent] = useState<StudentRow | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Edit modal
  const [editStudent, setEditStudent] = useState<StudentRow | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal
  const [deleteStudent, setDeleteStudent] = useState<StudentRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        const matchesQuery =
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.studentCode.toLowerCase().includes(query.toLowerCase()) ||
          item.email.toLowerCase().includes(query.toLowerCase());
        const matchesRisk = riskFilter === "All" || item.risk === riskFilter;
        const matchesStatus = statusFilter === "All" || item.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesQuery && matchesRisk && matchesStatus;
      }),
    [rows, query, riskFilter, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  // --- View profile ---
  const openView = async (student: StudentRow) => {
    setViewStudent(student);
    setProfileData(null);
    setProfileLoading(true);
    try {
      const res = await apiFetch(`/students/${encodeURIComponent(student.studentCode)}/profile`);
      if (res.ok) {
        setProfileData(await res.json());
      }
    } catch { /* silent */ }
    setProfileLoading(false);
  };

  // --- Edit ---
  const openEdit = (student: StudentRow) => {
    const [first, ...rest] = student.name.split(" ");
    setEditStudent(student);
    setEditFirstName(first || "");
    setEditLastName(rest.join(" ") || "");
    setEditEmail(student.email);
    setEditStatus(student.status);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editStudent) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await apiFetch(`/students/${encodeURIComponent(editStudent.studentCode)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: editFirstName,
          last_name: editLastName,
          email: editEmail,
          status: editStatus,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "Failed to update student");
      }
      showToast(`${editFirstName} ${editLastName} updated successfully`);
      setEditStudent(null);
      onRefresh?.();
    } catch (err: any) {
      setEditError(err.message || "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  // --- Delete ---
  const confirmDelete = async () => {
    if (!deleteStudent) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/students/${encodeURIComponent(deleteStudent.studentCode)}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "Failed to delete student");
      }
      showToast(`${deleteStudent.name} has been deactivated`);
      setDeleteStudent(null);
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || "Delete failed", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden p-0">
        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between bg-slate-50/50">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => { setPage(1); setQuery(e.target.value); }}
                placeholder="Search by name, ID, or email..."
                className="w-full pl-10 pr-4 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              value={riskFilter}
              onChange={(e) => { setPage(1); setRiskFilter(e.target.value as StudentRisk | "All"); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="All">All Risks</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {filtered.length} student{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Student</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Predicted GPA</th>
                <th className="px-5 py-3.5 font-semibold">Attendance</th>
                <th className="px-5 py-3.5 font-semibold">Risk</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
                      Loading student records...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-red-600">{error}</td>
                </tr>
              )}
              {visible.map((item) => (
                <tr key={item.studentCode} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 shrink-0">
                        {(item.name?.[0] || "S").toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.studentCode} • {item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={item.status === "active" ? "success" : item.status === "inactive" ? "danger" : "secondary"}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium">{formatGpa(item.predictedGpa)}</td>
                  <td className="px-5 py-3.5 text-slate-700">{formatPercent(item.attendance)}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={riskVariant(item.risk)}>{item.risk} Risk</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openView(item)}
                        title="View profile"
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        title="Edit student"
                        className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteStudent(item)}
                          title="Delete student"
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !error && visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No student records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing {start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setPage((v) => Math.max(1, v - 1))} disabled={clampedPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {clampedPage} / {totalPages}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setPage((v) => Math.min(totalPages, v + 1))} disabled={clampedPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ====== View Profile Modal ====== */}
      {viewStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setViewStudent(null)} />
          <div className="relative z-10 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Student Profile</h2>
              <button onClick={() => setViewStudent(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {profileLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
                Loading profile...
              </div>
            ) : profileData ? (
              <div className="space-y-5">
                {/* Student Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">Name</span><p className="font-semibold text-slate-900">{profileData.student?.full_name}</p></div>
                  <div><span className="text-slate-500">Code</span><p className="font-semibold text-slate-900">{profileData.student?.student_code}</p></div>
                  <div><span className="text-slate-500">Email</span><p className="font-semibold text-slate-900">{profileData.student?.email}</p></div>
                  <div><span className="text-slate-500">Gender</span><p className="font-semibold text-slate-900">{profileData.student?.gender}</p></div>
                  <div><span className="text-slate-500">Status</span><p><Badge variant={profileData.student?.status === "active" ? "success" : "danger"}>{profileData.student?.status}</Badge></p></div>
                  <div><span className="text-slate-500">Enrolled</span><p className="font-semibold text-slate-900">{profileData.student?.enrollment_date}</p></div>
                </div>

                {/* Academic Metrics */}
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Academic Metrics</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="text-slate-500 text-xs">Avg GPA</span>
                      <p className="text-lg font-bold text-slate-900">{profileData.academic_metrics?.average_gpa?.toFixed(2) ?? "N/A"}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="text-slate-500 text-xs">Attendance</span>
                      <p className="text-lg font-bold text-slate-900">{profileData.academic_metrics?.average_attendance_rate?.toFixed(1) ?? "N/A"}%</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="text-slate-500 text-xs">GPA Trend</span>
                      <p className="text-lg font-bold text-slate-900 capitalize">{profileData.academic_metrics?.gpa_trend ?? "N/A"}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="text-slate-500 text-xs">Semesters</span>
                      <p className="text-lg font-bold text-slate-900">{profileData.academic_metrics?.total_semesters ?? 0}</p>
                    </div>
                  </div>
                </div>

                {/* Latest Prediction */}
                {profileData.latest_prediction && (
                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Latest Prediction</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">Predicted GPA</span><p className="font-bold text-slate-900">{profileData.latest_prediction.predicted_gpa?.toFixed(2) ?? "N/A"}</p></div>
                      <div><span className="text-slate-500">Risk Level</span><p><Badge variant={riskVariant(profileData.latest_prediction.risk_level || "Unknown")}>{profileData.latest_prediction.risk_level || "Unknown"}</Badge></p></div>
                      <div className="col-span-2"><span className="text-slate-500">Recommendation</span><p className="font-medium text-slate-700 text-xs mt-1">{profileData.latest_prediction.recommendation || "No recommendation"}</p></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">Could not load profile data.</p>
            )}
          </div>
        </div>
      )}

      {/* ====== Edit Modal ====== */}
      {editStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditStudent(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Edit Student</h2>
              <button onClick={() => setEditStudent(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-slate-400 font-medium mb-1">Student Code: {editStudent.studentCode}</div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {editError && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{editError}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setEditStudent(null)}>Cancel</Button>
                <Button onClick={saveEdit} disabled={editSaving || !editFirstName.trim() || !editLastName.trim() || !editEmail.trim()}>
                  {editSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Delete Confirmation Modal ====== */}
      {deleteStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteStudent(null)} />
          <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Deactivate Student</h2>
              <p className="text-sm text-slate-500">
                Are you sure you want to deactivate <span className="font-semibold text-slate-700">{deleteStudent.name}</span> ({deleteStudent.studentCode})? Their status will be set to inactive.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteStudent(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={confirmDelete} disabled={deleteLoading}>
                {deleteLoading ? "Processing..." : "Deactivate"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Toast ====== */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
