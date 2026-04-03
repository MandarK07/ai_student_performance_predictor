import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import { fetchStudentDashboard } from "../api/dashboard";

type StudentData = {
  academic_metrics?: {
    latest_gpa: number | null;
    average_attendance_rate: number | null;
  };
  latest_prediction?: {
    predicted_gpa: number;
    risk_level: string;
    recommendation: string;
  };
  recommendations?: { text: string; source: string }[];
};

export default function StudentDashboard() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const json = await fetchStudentDashboard();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  if (loading) return <p>Loading your profile...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome to your personal learning overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Latest GPA</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
             {data?.academic_metrics?.latest_gpa?.toFixed(2) || "N/A"}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Predicted Upcoming GPA</p>
          <p className="mt-2 text-3xl font-bold text-brand-600">
             {data?.latest_prediction?.predicted_gpa?.toFixed(2) || "N/A"}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Avg Attendance Rate</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
             {data?.academic_metrics?.average_attendance_rate ? `${(data.academic_metrics.average_attendance_rate * 100).toFixed(0)}%` : "N/A"}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Recommendations</h2>
        <div className="space-y-3">
           {data?.recommendations?.length ? (
             data.recommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-brand-50 border border-brand-100 rounded-lg">
                    <span className="text-brand-800 text-sm">{rec.text}</span>
                </div>
             ))
           ) : (
             <p className="text-sm text-slate-500">No active recommendations right now.</p>
           )}
        </div>
      </Card>
    </div>
  );
}
