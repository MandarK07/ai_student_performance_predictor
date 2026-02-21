import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

type NavbarProps = {
  onToggleSidebar: () => void;
};

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="md:hidden" onClick={onToggleSidebar}>
            Menu
          </Button>
          <div>
            <p className="text-sm text-slate-500">AI-Based Student Performance Predictor</p>
            <h2 className="text-base font-semibold text-slate-900">Analytics Dashboard</h2>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-slate-300"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {(user?.full_name?.[0] || user?.username?.[0] || "U").toUpperCase()}
            </span>
            <span>
              <span className="block text-sm font-medium text-slate-900">{user?.full_name || user?.username || "User"}</span>
              <span className="block text-xs text-slate-500">{user?.role || "guest"}</span>
            </span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-soft">
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
