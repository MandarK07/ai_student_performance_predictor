import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

type MenuItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

const items: MenuItem[] = [
  { to: "/", label: "Dashboard", icon: <span>D</span> },
  { to: "/students", label: "Students", icon: <span>S</span> },
  { to: "/predict", label: "Predictor", icon: <span>P</span> },
  { to: "/prediction-result", label: "Results", icon: <span>R</span> },
  { to: "/upload-csv", label: "CSV Upload", icon: <span>U</span> },
  { to: "/profile", label: "Profile", icon: <span>F</span> },
  { to: "/at-risk", label: "At-Risk", icon: <span>!</span> },
  { to: "/about", label: "About", icon: <span>A</span> },
];

function linkClass(isActive: boolean) {
  return [
    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
    isActive ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-900/40 transition md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={[
          "fixed left-0 top-0 z-40 h-full w-72 border-r border-slate-200 bg-white px-4 py-6 transition-transform duration-300",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold text-slate-900">AI Predictor</h1>
          <p className="text-xs text-slate-500">Student Analytics</p>
        </div>
        <nav className="space-y-1">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
