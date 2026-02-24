import { useState } from "react";
import { signupUser, type RegisterUserResponse, type SignupRequest } from "../api/auth";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Link, useNavigate } from "react-router-dom";

const initialForm: SignupRequest = {
  username: "",
  email: "",
  password: "",
  full_name: "",
};

export default function RegisterUser() {
  const [formData, setFormData] = useState<SignupRequest>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterUserResponse | null>(null);
  const navigate = useNavigate();

  const handleChange = (field: keyof SignupRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await signupUser(formData);
      setResult(response);
      setFormData(initialForm);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
        <p className="text-sm text-slate-500">Sign up to access the student analytics platform.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4">
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
          <div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Sign Up"}
            </Button>
            <p className="mt-3 text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                Sign In
              </Link>
            </p>
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
          <Badge variant="success">Account Created</Badge>
          <p className="mt-2 text-sm text-slate-700">Welcome {result.full_name}. Redirecting to sign-in...</p>
        </Card>
      )}
    </div>
  );
}
