import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, BarChart3, Gauge, GraduationCap, Info, Upload, UserCircle2, WandSparkles } from "lucide-react";
import { cn } from "../../lib/utils";

type SidebarProps = {
  isOpen: boolean;
};

type MenuItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const items: MenuItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/students", label: "Students", icon: GraduationCap },
  { to: "/predict", label: "Predictor", icon: WandSparkles },
  { to: "/prediction-result", label: "Results", icon: BarChart3 },
  { to: "/upload-csv", label: "CSV Upload", icon: Upload },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
  { to: "/at-risk", label: "At-Risk", icon: AlertTriangle },
  { to: "/about", label: "About", icon: Info },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside className={cn("flex flex-col border-r border-slate-200 bg-white transition-all duration-300", isOpen ? "w-72" : "w-20")}>
      <div className="p-3">
        <div className={cn("mb-8", isOpen ? "px-2" : "flex justify-center")}>
          <NavLink
            to="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700 transition hover:bg-brand-200"
            title="Home"
          >
            AI
          </NavLink>
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={!isOpen ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                    isActive ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    !isOpen && "justify-center px-2"
                  )
                }
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon className="h-4 w-4" />
                </span>
                {isOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
