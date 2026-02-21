import { apiFetch } from "./http";

export interface PredictionRequest {
  student_code: string;
  gender: string;
  age: number;
  parent_education: string;
  attendance_rate: number;
  study_hours: number;
  previous_gpa: number;
  final_grade: number;
  assignment_score_avg: number;
  exam_score_avg: number;
  class_participation: number;
  late_submissions: number;
  previous_gpa_sem1: number;
  previous_gpa_sem2: number;
  academic_year?: string;
  semester?: string;
}

export interface PredictionResponse {
  prediction_id: string;
  student_code: string;
  predicted_gpa: number;
  predicted_category: string;
  confidence_score: number;
  risk_level: string;
  recommendation: string;
  prediction_date: string;
}

export interface StudentPredictionsResponse {
  student_code: string;
  latest_prediction: {
    predicted_gpa: number | null;
    category: string | null;
    confidence: number | null;
    risk_level: string | null;
    recommendation: string | null;
    date: string;
  } | null;
  message?: string;
}

export interface AtRiskStudent {
  student_code: string;
  full_name: string;
  email: string;
  predicted_gpa: number | null;
  risk_level: string;
  confidence_score: number | null;
  recommendation: string | null;
}

export interface AtRiskStudentsResponse {
  count: number;
  students: AtRiskStudent[];
}

export interface UploadCsvResponse {
  message: string;
  total_records: number;
  success: number;
  failed: number;
  results: Array<{
    student_code: string;
    predicted_gpa: number;
    category: string;
    confidence: number;
    risk_level: string;
  }>;
  errors?: Array<{
    row: number;
    student_code: string;
    error: string;
  }> | null;
}

export async function fetchPrediction(data: PredictionRequest): Promise<PredictionResponse> {
  const response = await apiFetch("/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Prediction API error");
  }
  
  return await response.json();
}

export async function getStudentPredictions(studentCode: string): Promise<StudentPredictionsResponse> {
  const response = await apiFetch(`/predictions/${encodeURIComponent(studentCode)}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch student predictions");
  }
  
  return await response.json();
}

export async function getAtRiskStudents(): Promise<AtRiskStudentsResponse> {
  const response = await apiFetch("/at-risk-students");
  
  if (!response.ok) {
    throw new Error("Failed to fetch at-risk students");
  }
  
  return await response.json();
}

export async function uploadCSV(file: File): Promise<UploadCsvResponse> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await apiFetch("/upload-csv", {
    method: "POST",
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    const detail = error.detail;
    if (typeof detail === "string") {
      throw new Error(detail);
    }
    if (detail && typeof detail === "object" && detail.error === "Missing required columns") {
      const missing = Array.isArray(detail.missing) ? detail.missing.join(", ") : "unknown";
      throw new Error(`Missing required columns: ${missing}`);
    }
    throw new Error("CSV upload failed");
  }
  
  return await response.json();
}
