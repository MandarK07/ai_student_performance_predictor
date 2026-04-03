import { useAuth } from "../context/AuthContext";
import StudentDashboard from "./StudentDashboard";
import MainDashboard from "./MainDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "student") {
      return <StudentDashboard />;
  }

  // Admin or teacher defaults to the main analytics dashboard
  return <MainDashboard />;
}
