import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { apiFetch } from "../api/http";
import { Pencil, Trash2, ShieldCheck, ShieldOff, X, Search, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type UserSummary = {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
};

type EditingUser = {
  user_id: string;
  full_name: string;
  username: string;
  role: string;
  is_active: boolean;
};

export default function UsersManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm state
  const [deletingUser, setDeletingUser] = useState<UserSummary | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = async () => {
    try {
      const res = await apiFetch("/admin/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  // --- Edit user ---
  const openEdit = (u: UserSummary) => {
    setEditingUser({ user_id: u.user_id, full_name: u.full_name, username: u.username, role: u.role, is_active: u.is_active });
    setEditRole(u.role);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await apiFetch(`/admin/users/${editingUser.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "Failed to update user");
      }
      showToast(`Role updated for ${editingUser.full_name}`);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setEditError(err.message || "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  // --- Toggle active status ---
  const toggleActive = async (u: UserSummary) => {
    try {
      const res = await apiFetch(`/admin/users/${u.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "Failed to update status");
      }
      showToast(`${u.full_name} ${u.is_active ? "deactivated" : "reactivated"} successfully`);
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Action failed", "error");
    }
  };

  // --- Delete user ---
  const confirmDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/admin/users/${deletingUser.user_id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "Failed to delete user");
      }
      showToast(`${deletingUser.full_name} has been deleted`);
      setDeletingUser(null);
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Delete failed", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Filter ---
  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSelf = (u: UserSummary) => u.user_id === currentUser?.user_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage platform users, roles, and access permissions.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-xl px-4 py-2 text-sm font-semibold">
          <Users className="h-4 w-4" />
          {users.length} total users
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, username, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
        />
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {searchQuery ? "No users match your search." : "No users found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((u) => (
                  <tr key={u.user_id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 shrink-0">
                          {(u.full_name?.[0] || "U").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.full_name}</p>
                          <p className="text-xs text-slate-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.is_active ? "success" : "danger"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit Role */}
                        <button
                          onClick={() => openEdit(u)}
                          title="Edit role"
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* Toggle active */}
                        <button
                          onClick={() => toggleActive(u)}
                          disabled={isSelf(u)}
                          title={u.is_active ? "Deactivate" : "Reactivate"}
                          className={`p-2 rounded-lg transition-colors ${
                            isSelf(u)
                              ? "text-slate-300 cursor-not-allowed"
                              : u.is_active
                              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {u.is_active ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeletingUser(u)}
                          disabled={isSelf(u)}
                          title="Delete user"
                          className={`p-2 rounded-lg transition-colors ${
                            isSelf(u)
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ====== Edit Modal ====== */}
      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Edit User Role</h2>
              <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">User</p>
                <p className="text-sm font-semibold text-slate-900">{editingUser.full_name} <span className="font-normal text-slate-400">(@{editingUser.username})</span></p>
              </div>

              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <select
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>

              {editError && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button
                  onClick={saveEdit}
                  disabled={editSaving || editRole === editingUser.role}
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Delete Confirmation Modal ====== */}
      {deletingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeletingUser(null)} />
          <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Delete User</h2>
              <p className="text-sm text-slate-500">
                Are you sure you want to deactivate <span className="font-semibold text-slate-700">{deletingUser.full_name}</span>? This will revoke their access immediately.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setDeletingUser(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={confirmDelete} disabled={deleteLoading}>
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Toast ====== */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
