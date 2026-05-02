import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

// Lazy load pages
const Login = lazy(() => import("./pages/Login"));
const RegisterUser = lazy(() => import("./pages/RegisterUser"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Home = lazy(() => import("./pages/Home"));
const Students = lazy(() => import("./pages/Students"));
const Predictor = lazy(() => import("./pages/Predictor"));
const PredictionResult = lazy(() => import("./pages/PredictionResult"));
const CsvUploadPage = lazy(() => import("./pages/CsvUploadPage"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const MainDashboard = lazy(() => import("./pages/MainDashboard"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const AtRiskStudents = lazy(() => import("./pages/AtRiskStudents"));
const About = lazy(() => import("./pages/About"));
const Analytics = lazy(() => import("./pages/Analytics"));
const UsersManagement = lazy(() => import("./pages/UsersManagement"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Settings = lazy(() => import("./pages/Settings"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const EnrollmentPending = lazy(() => import("./pages/EnrollmentPending"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const Invites = lazy(() => import("./pages/Invites"));

// Loading fallback component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
      <div className="absolute inset-0 blur-xl bg-indigo-500/20 rounded-full animate-pulse"></div>
    </div>
  </div>
);


function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-user" element={<RegisterUser />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/enrollment-pending" element={<ProtectedRoute><EnrollmentPending /></ProtectedRoute>} />
          <Route path="/enroll/:token" element={<AcceptInvite />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Admin Only routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]}><Outlet /></ProtectedRoute>}>
              <Route path="/admin-dashboard" element={<MainDashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/users" element={<UsersManagement />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Teacher Only routes */}
            <Route element={<ProtectedRoute allowedRoles={["teacher"]}><Outlet /></ProtectedRoute>}>
              <Route path="/teacher-dashboard" element={<MainDashboard />} />
            </Route>

            {/* Admin & Teacher */}
            <Route element={<ProtectedRoute allowedRoles={["admin", "teacher"]}><Outlet /></ProtectedRoute>}>
              <Route path="/students" element={<Students />} />
              <Route path="/upload-csv" element={<CsvUploadPage />} />
              <Route path="/upload" element={<Navigate to="/upload-csv" replace />} />
              <Route path="/at-risk" element={<AtRiskStudents />} />
              <Route path="/invites" element={<Invites />} />
            </Route>

            {/* Student Only routes */}
            <Route element={<ProtectedRoute allowedRoles={["student"]}><Outlet /></ProtectedRoute>}>
              <Route path="/student-dashboard" element={<StudentDashboard />} />
            </Route>

            {/* Open to all authenticated users */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/home" element={<Home />} />
            <Route path="/predictor" element={<Navigate to="/predict" replace />} />
            <Route
              path="/predict"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "student"]}>
                  <Predictor />
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<StudentProfile />} />
            <Route
              path="/prediction-result"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "student"]}>
                  <PredictionResult />
                </ProtectedRoute>
              }
            />
            <Route path="/results" element={<Navigate to="/prediction-result" replace />} />
            <Route path="/about" element={<About />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
