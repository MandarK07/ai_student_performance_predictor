import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-user" element={<RegisterUser />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/home" element={<Home />} />
          <Route path="/students" element={<Students />} />
          <Route path="/predict" element={<Predictor />} />
          <Route path="/prediction-result" element={<PredictionResult />} />
          <Route path="/results" element={<Navigate to="/prediction-result" replace />} />
          <Route path="/upload-csv" element={<CsvUploadPage />} />
          <Route path="/upload" element={<Navigate to="/upload-csv" replace />} />
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="/at-risk" element={<AtRiskStudents />} />
          <Route path="/about" element={<About />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
