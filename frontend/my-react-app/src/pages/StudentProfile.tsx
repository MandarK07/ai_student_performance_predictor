import { useState } from "react";
import type { FormEvent } from "react";
import { fetchStudentProfile, type StudentProfileResponse } from "../api/students";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

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
  const [studentCode, setStudentCode] = useState("");
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = studentCode.trim();

    if (!normalizedCode) {
      setError("Please enter a student code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchStudentProfile(normalizedCode);
      setProfile(response);
    } catch (submitError) {
      setProfile(null);
      setError(submitError instanceof Error ? submitError.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Profile</h1>
        <p className="text-sm text-slate-500">View academic metrics, prediction history, interventions, and recommendation feed.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={studentCode}
            onChange={(event) => setStudentCode(event.target.value)}
            placeholder="Enter Student Code (e.g., S2024001)"
            className="min-w-[260px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
          />
          <Button type="submit">Load Profile</Button>
        </form>
      </Card>

      {loading && (
        <Card>
          <p className="text-sm text-slate-600">Loading student profile...</p>
        </Card>
      )}

      {error && (
        <Card className="border-l-4 border-l-red-500">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </Card>
      )}

      {profile && !loading && (
        <>
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{profile.student.full_name}</h2>
              <Badge variant="info">{profile.student.status}</Badge>
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
              <p className="mt-2 text-sm text-slate-500">No academic records available.</p>
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
                      {recommendation.risk_level ? ` • Risk: ${recommendation.risk_level}` : ""}
                      {recommendation.priority ? ` • Priority: ${recommendation.priority}` : ""}
                      {recommendation.status ? ` • Status: ${recommendation.status}` : ""}
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
