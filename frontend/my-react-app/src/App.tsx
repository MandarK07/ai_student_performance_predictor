import { BrowserRouter as Router, Navigate, Route, Routes, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import RegisterUser from "./pages/RegisterUser";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Students from "./pages/Students";
import Predictor from "./pages/Predictor";
import PredictionResult from "./pages/PredictionResult";
import CsvUploadPage from "./pages/CsvUploadPage";
import StudentProfile from "./pages/StudentProfile";
import AtRiskStudents from "./pages/AtRiskStudents";
import About from "./pages/About";
import Analytics from "./pages/Analytics";
import UsersManagement from "./pages/UsersManagement";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import AccessDenied from "./pages/AccessDenied";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-user" element={<RegisterUser />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Admin Only routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]}><Outlet /></ProtectedRoute>}>
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Admin & Teacher */}
          <Route element={<ProtectedRoute allowedRoles={["admin", "teacher"]}><Outlet /></ProtectedRoute>}>
            <Route path="/students" element={<Students />} />
            <Route path="/upload-csv" element={<CsvUploadPage />} />
            <Route path="/upload" element={<Navigate to="/upload-csv" replace />} />
            <Route path="/at-risk" element={<AtRiskStudents />} />
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
    </Router>
  );
}

export default App;
