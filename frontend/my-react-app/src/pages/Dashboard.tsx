import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleTargets: Record<string, string> = {
    admin: "/admin-dashboard",
    teacher: "/teacher-dashboard",
    student: "/student-dashboard"
  };

  const target = roleTargets[user.role] || "/admin-dashboard";
  
  return <Navigate to={target} replace />;
}
