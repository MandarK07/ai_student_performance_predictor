import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Download } from "lucide-react";
import { fetchStudentDashboard } from "../api/dashboard";
import { fetchStudentProfile, type StudentProfileResponse } from "../api/students";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "N/A";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleString();
}

function formatNumber(value: number | null | undefined, fractionDigits = 2): string {
  if (value === null || value === undefined) {
    return "N/A";
  }
  return value.toFixed(fractionDigits);
}

function formatConfidence(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "N/A";
  }
  const percentage = value <= 1 ? value * 100 : value;
  return `${percentage.toFixed(2)}%`;
}

function riskVariant(level: string | null | undefined): "low" | "medium" | "high" {
  const value = (level || "").toLowerCase();
  if (value.includes("high") || value.includes("critical")) {
    return "high";
  }
  if (value.includes("medium")) {
    return "medium";
  }
  return "low";
}

type StatProps = {
  label: string;
  value: string | number;
};

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function StudentProfile() {
  const { user, loading: authLoading } = useAuth();
  const [studentCode, setStudentCode] = useState("");
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoLoadedRef = useRef(false);
  const isStudentRole = user?.role === "student";

  const loadProfileByCode = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchStudentProfile(code);
      setProfile(response);
    } catch (submitError) {
      setProfile(null);
      setError(submitError instanceof Error ? submitError.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const loadOwnProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchStudentDashboard();
      setProfile(response);
    } catch (submitError) {
      setProfile(null);
      setError(submitError instanceof Error ? submitError.message : "Failed to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isStudentRole || hasAutoLoadedRef.current) {
      return;
    }

    hasAutoLoadedRef.current = true;
    void loadOwnProfile();
  }, [authLoading, isStudentRole]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = studentCode.trim();

    if (!normalizedCode) {
      setError("Please enter a student code.");
      return;
    }

    await loadProfileByCode(normalizedCode);
  };

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-2xl font-bold text-slate-900">Student Profile</h1>
        <p className="text-sm text-slate-500">View academic metrics, prediction history, interventions, and recommendation feed.</p>
      </div>

      {isStudentRole ? (
        <Card className="no-print">
          <p className="text-sm text-slate-600">Your profile is loaded automatically from your signed-in student account.</p>
        </Card>
      ) : (
        <Card className="no-print">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={studentCode}
              onChange={(event) => setStudentCode(event.target.value)}
              placeholder="Enter Student Code (e.g., S2024001)"
              className="min-w-[260px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
            />
            <Button type="submit" disabled={loading}>Load Profile</Button>
          </form>
        </Card>
      )}

      {(authLoading || loading) && (
        <Card className="no-print">
          <p className="text-sm text-slate-600">Loading student profile...</p>
        </Card>
      )}

      {error && (
        <Card className="border-l-4 border-l-red-500">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </Card>
      )}

      {profile && !authLoading && !loading && (
        <>
          {/* Print Only Header */}
          <div className="print-only mb-8 border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Academic Intervention & Support Report</h1>
                <p className="text-slate-500 font-medium">Student Performance Analysis | Academic Year 2023-2024</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">AI Student Performance Predictor</p>
                <p className="text-xs text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Print Only Executive Summary */}
          <div className="print-only mb-10">
            <h2 className="text-xl font-bold text-indigo-900 mb-4 p-2 bg-indigo-50 rounded-lg border-l-4 border-indigo-600">Executive Summary: Critical Recommendations</h2>
            {profile.recommendations.length > 0 ? (
              <div className="grid gap-3">
                {profile.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-indigo-100 bg-white">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{rec.source} recommendation</span>
                    </div>
                    <p className="text-slate-900 font-medium leading-relaxed">{rec.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No specific recommendations recorded for this period.</p>
            )}
          </div>

          {/* Print Only Active Interventions */}
          <div className="print-only mb-10">
            <h2 className="text-xl font-bold p-2 bg-slate-50 border-l-4 border-slate-800 uppercase tracking-tight mb-4">Required Support Interventions</h2>
            <div className="space-y-6">
              {profile.prediction_history.some(p => p.interventions.length > 0) ? (
                profile.prediction_history.flatMap(p => p.interventions).map((inv, idx) => (
                  <div key={idx} className="p-4 border border-slate-900 bg-white">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-3">
                      <h3 className="font-bold text-lg text-black uppercase tracking-wide">
                        {inv.intervention_type || 'Academic Support'}
                      </h3>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 uppercase block">Status</span>
                        <span className="font-bold text-black uppercase">{inv.status || 'PENDING'}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Details & Plan:</p>
                      <p className="text-black font-medium leading-relaxed">{inv.description || 'No detailed instructions provided.'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Assigned Staff:</p>
                        <p className="font-semibold text-black">{inv.assigned_to || 'Academic Support Team'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Target Completion:</p>
                        <p className="font-semibold text-black">{inv.due_date ? formatDate(inv.due_date) : 'ASAP'}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic p-4 border border-dashed border-slate-300">No active interventions have been recorded for this student.</p>
              )}
            </div>
          </div>

          <Card className="space-y-3 no-shadow-print">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 items-center justify-center hidden print:flex">
                  <span className="text-lg font-bold text-slate-700">{profile.student.full_name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{profile.student.full_name}</h2>
                  <Badge variant="info">{profile.student.status}</Badge>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => window.print()}
                className="no-print"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Stat label="Student Code" value={profile.student.student_code} />
              <Stat label="Email" value={profile.student.email || "N/A"} />
              <Stat label="Gender" value={profile.student.gender || "N/A"} />
              <Stat label="Enrollment" value={formatDate(profile.student.enrollment_date)} />
              <Stat label="Date of Birth" value={formatDate(profile.student.date_of_birth)} />
              <Stat label="Created" value={formatDate(profile.student.created_at)} />
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Academic Metrics</h3>
            {profile.academic_metrics.total_semesters === 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                No academic records have been imported for this student yet.
              </div>
            )}
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Stat label="Total Semesters" value={profile.academic_metrics.total_semesters} />
              <Stat label="Latest GPA" value={formatNumber(profile.academic_metrics.latest_gpa)} />
              <Stat label="Average GPA" value={formatNumber(profile.academic_metrics.average_gpa)} />
              <Stat label="Latest Attendance" value={`${formatNumber(profile.academic_metrics.latest_attendance_rate)}%`} />
              <Stat label="Average Attendance" value={`${formatNumber(profile.academic_metrics.average_attendance_rate)}%`} />
              <Stat label="Avg Study Hours/Week" value={formatNumber(profile.academic_metrics.average_study_hours_per_week)} />
              <Stat label="Total Absences" value={profile.academic_metrics.total_absences} />
              <Stat label="Late Submissions" value={profile.academic_metrics.total_late_submissions} />
              <Stat label="GPA Trend" value={profile.academic_metrics.gpa_trend || "N/A"} />
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Academic History</h3>
            {profile.academic_history.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No academic records have been imported for this student yet.</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Year</th>
                      <th className="px-3 py-2 font-semibold">Semester</th>
                      <th className="px-3 py-2 font-semibold">GPA</th>
                      <th className="px-3 py-2 font-semibold">Attendance</th>
                      <th className="px-3 py-2 font-semibold">Study Hours</th>
                      <th className="px-3 py-2 font-semibold">Late Subs</th>
                      <th className="px-3 py-2 font-semibold">Absences</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.academic_history.map((record) => (
                      <tr key={record.record_id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{record.academic_year}</td>
                        <td className="px-3 py-2">{record.semester}</td>
                        <td className="px-3 py-2">{formatNumber(record.gpa)}</td>
                        <td className="px-3 py-2">{formatNumber(record.attendance_rate)}%</td>
                        <td className="px-3 py-2">{formatNumber(record.study_hours_per_week)}</td>
                        <td className="px-3 py-2">{record.late_submissions ?? "N/A"}</td>
                        <td className="px-3 py-2">{record.absences ?? "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Prediction History</h3>
            {profile.prediction_history.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No prediction history available.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {profile.prediction_history.map((item) => (
                  <div key={item.prediction_id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.academic_year} - {item.semester}
                      </p>
                      <Badge variant={riskVariant(item.risk_level)}>{item.risk_level || "N/A"}</Badge>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <p className="text-sm text-slate-700">Predicted GPA: {formatNumber(item.predicted_gpa)}</p>
                      <p className="text-sm text-slate-700">Category: {item.predicted_category || "N/A"}</p>
                      <p className="text-sm text-slate-700">Confidence: {formatConfidence(item.confidence_score)}</p>
                      <p className="text-sm text-slate-700">Date: {formatDate(item.prediction_date)}</p>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      Model: {item.model ? `${item.model.model_name} ${item.model.model_version} (${item.model.algorithm})` : "N/A"}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">Recommendation: {item.recommendation || "N/A"}</p>

                    {item.interventions.length > 0 && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">Interventions</p>
                        <ul className="mt-1 space-y-1 text-sm text-slate-600">
                          {item.interventions.map((intervention) => (
                            <li key={intervention.intervention_id}>
                              {intervention.intervention_type || "Action"} ({intervention.priority || "N/A"}, {intervention.status || "N/A"}): {" "}
                              {intervention.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Recommendation Feed</h3>
            {profile.recommendations.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No recommendations available.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {profile.recommendations.map((recommendation, index) => (
                  <div key={`${recommendation.source}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-900">{recommendation.source === "prediction" ? "Prediction" : "Intervention"}</p>
                    <p className="mt-1 text-slate-700">{recommendation.text}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(recommendation.date)}
                      {recommendation.risk_level ? ` | Risk: ${recommendation.risk_level}` : ""}
                      {recommendation.priority ? ` | Priority: ${recommendation.priority}` : ""}
                      {recommendation.status ? ` | Status: ${recommendation.status}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
