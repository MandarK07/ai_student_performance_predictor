import { useState } from "react";
import { registerUser, type RegisterUserRequest, type RegisterUserResponse } from "../api/auth";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const initialForm: RegisterUserRequest = {
  username: "",
  email: "",
  password: "",
  full_name: "",
  role: "teacher",
  is_active: true,
};

export default function RegisterUser() {
  const [formData, setFormData] = useState<RegisterUserRequest>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterUserResponse | null>(null);

  const handleChange = (field: keyof RegisterUserRequest, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await registerUser(formData);
      setResult(response);
      setFormData({ ...initialForm, role: formData.role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Register User</h1>
        <p className="text-sm text-slate-500">Admin-only form to create new users.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value)}
            placeholder="Username"
            required
            minLength={3}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
          />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Email"
            required
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
          />
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="Password (min 8 chars)"
            required
            minLength={8}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
          />
          <input
            value={formData.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            placeholder="Full Name"
            required
            minLength={2}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
          />
          <select
            value={formData.role}
            onChange={(e) => handleChange("role", e.target.value as RegisterUserRequest["role"])}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
          >
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="counselor">Counselor</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(formData.is_active)}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Active account
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </Card>

      {error && (
        <Card className="border-l-4 border-l-red-500">
          <Badge variant="danger">Error</Badge>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </Card>
      )}

      {result && (
        <Card className="border-l-4 border-l-emerald-500">
          <Badge variant="success">User Created</Badge>
          <p className="mt-2 text-sm text-slate-700">
            {result.username} ({result.role}) - {result.email}
          </p>
        </Card>
      )}
    </div>
  );
}
