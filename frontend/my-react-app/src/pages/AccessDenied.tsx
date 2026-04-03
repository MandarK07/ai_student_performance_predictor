import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-soft text-center">
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-600">You do not have permission to view this page.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            to="/dashboard"
            className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Go to Dashboard
          </Link>
          <Link to="/login" className="text-sm text-brand-700 hover:underline">
            Switch account
          </Link>
        </div>
      </div>
    </div>
  );
}
