import { NavLink } from "react-router-dom";
import { AlertTriangle, BarChart3, Gauge, GraduationCap, Upload, WandSparkles, Link as LinkIcon, Users, FileText } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

type SidebarProps = {
  isOpen: boolean;
};

// Simplified flat menu specific to requirements
const items = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/analytics", label: "Analytics", icon: BarChart3, roles: ["admin"] },
  { to: "/users", label: "Users Management", icon: Users, roles: ["admin"] },
  { to: "/audit-logs", label: "Audit Logs", icon: FileText, roles: ["admin"] },
  { to: "/students", label: "Students", icon: GraduationCap, roles: ["admin", "teacher"] },
  { to: "/predict", label: "Predictor", icon: WandSparkles, roles: ["admin", "teacher","student"] },
  { to: "/prediction-result", label: "Results", icon: BarChart3, roles: ["admin", "teacher", "student"] },
  { to: "/at-risk", label: "At-Risk", icon: AlertTriangle, roles: ["admin", "teacher"] },
  { to: "/upload-csv", label: "CSV Upload", icon: Upload, roles: ["admin", "teacher"] },
  { to: "/invites", label: "Invites", icon: LinkIcon, roles: ["admin", "teacher"] },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const { user } = useAuth();

  const visibleItems = items.filter(item => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-slate-200 transition-all duration-300 ease-in-out h-full overflow-hidden shrink-0 z-50",
        isOpen ? "w-64 border-r translate-x-0" : "w-0 border-r-0 -translate-x-full md:translate-x-0",
        "absolute md:relative top-0 left-0"
      )}
    >
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 w-64">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
