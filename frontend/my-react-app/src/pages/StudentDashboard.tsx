import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import { fetchStudentDashboard, type StudentDashboardPayload } from "../api/dashboard";
import { 
  GraduationCap, 
  TrendingUp, 
  Calendar, 
  Lightbulb,
  ArrowUpRight,
  User,
  Activity,
  AlertCircle
} from "lucide-react";
import Badge from "../components/ui/Badge";

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardPayload | null>(null);
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-slate-500 font-medium tracking-wide">Synchronizing academic data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <Card className="border-l-4 border-l-red-500 bg-red-50/30 p-4">
            <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <p className="text-red-700 font-medium">{error}</p>
            </div>
        </Card>
    );
  }

  const name = data?.student?.full_name || "Student";
  const hasAcademicData = data?.academic_metrics?.latest_gpa !== null && data?.academic_metrics?.latest_gpa !== undefined;
  const hasAttendanceData = data?.academic_metrics?.average_attendance_rate !== null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Welcome, {name.split(' ')[0]}!
            <span className="text-3xl">👋</span>
          </h1>
          <p className="mt-1 text-slate-500 font-medium">Your personalized AI-driven academic roadmap.</p>
        </div>
        <Badge variant={data?.latest_prediction?.risk_level === 'Low' ? 'success' : 'warning'} className="px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
            Status: {data?.student?.status || "Active"}
        </Badge>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard 
            label="Current GPA" 
            value={hasAcademicData ? data?.academic_metrics?.latest_gpa?.toFixed(2) : "Data Pending"} 
            icon={<GraduationCap className="h-6 w-6 text-indigo-600" />}
            color="bg-indigo-50"
            subtext={hasAcademicData ? "From latest record" : "Upload your grades"}
        />
        <MetricCard 
            label="AI Predicted GPA" 
            value={data?.latest_prediction?.predicted_gpa ? data.latest_prediction.predicted_gpa.toFixed(2) : "Calculating..."} 
            icon={<TrendingUp className="h-6 w-6 text-brand-600" />}
            color="bg-brand-50"
            highlight={true}
            subtext={data?.latest_prediction ? `Risk: ${data.latest_prediction.risk_level}` : "Run a new prediction"}
        />
        <MetricCard 
            label="Attendance Score" 
            value={hasAttendanceData ? `${data?.academic_metrics?.average_attendance_rate.toFixed(1)}%` : "N/A"} 
            icon={<Calendar className="h-6 w-6 text-emerald-600" />}
            color="bg-emerald-50"
            subtext={hasAttendanceData ? "Engagement average" : "Attendance not recorded"}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-6 w-6 text-brand-500" />
            <h2 className="text-xl font-bold text-slate-900">Personalized Recommendations</h2>
          </div>
          
          <div className="grid gap-4">
             {data?.recommendations?.length ? (
               data.recommendations.map((rec, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-brand-200">
                    <div className="absolute left-0 top-0 h-full w-1 bg-brand-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="flex items-start gap-4">
                        <div className="mt-1 rounded-full bg-brand-50 p-2 text-brand-600">
                            <ArrowUpRight className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                {rec.source === 'prediction' ? 'AI Strategy' : 'Support Plan'}
                            </span>
                            <p className="mt-1 text-slate-700 font-medium leading-relaxed">{rec.text}</p>
                        </div>
                    </div>
                  </div>
               ))
             ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-slate-50/50">
                    <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No active recommendations. You're meeting all academic benchmarks!</p>
                </div>
             )}
          </div>
        </div>

        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Activity className="h-6 w-6 text-indigo-500" />
                <h2 className="text-xl font-bold text-slate-900">Health Vitals</h2>
            </div>
            
            <Card className="bg-slate-900 text-white border-none py-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <User className="h-24 w-24" />
                </div>
                <div className="flex flex-col items-center text-center relative z-10">
                    <div className="rounded-full bg-slate-800 p-4 mb-4">
                        <User className="h-8 w-8 text-brand-400" />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Enrollment Number</p>
                    <p className="text-xl font-bold mt-1 tracking-tight">{data?.student?.student_code}</p>
                    
                    <div className="mt-8 grid grid-cols-2 gap-4 w-full px-4">
                        <div className="rounded-xl bg-slate-800/50 p-3 ring-1 ring-white/5">
                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Absences</p>
                            <p className="text-2xl font-bold text-rose-400">
                                {data?.academic_metrics?.total_absences !== undefined ? data.academic_metrics.total_absences : '--'}
                            </p>
                        </div>
                        <div className="rounded-xl bg-slate-800/50 p-3 ring-1 ring-white/5">
                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Late Subs</p>
                            <p className="text-2xl font-bold text-amber-400">
                                {data?.academic_metrics?.total_late_submissions !== undefined ? data.academic_metrics.total_late_submissions : '--'}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}

import { CheckCircle2 } from "lucide-react";

function MetricCard({ label, value, icon, color, highlight = false, subtext }: { label: string; value: string; icon: React.ReactNode, color: string, highlight?: boolean, subtext?: string }) {
    return (
        <Card className={`relative overflow-hidden transition-all hover:scale-[1.02] ${highlight ? 'border-brand-200 ring-2 ring-brand-500/10' : ''}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className={`mt-2 text-2xl font-black tracking-tight ${highlight ? 'text-brand-600' : 'text-slate-900'}`}>
                        {value}
                    </p>
                    {subtext && <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">{subtext}</p>}
                </div>
                <div className={`rounded-xl ${color} p-3 shrink-0`}>
                    {icon}
                </div>
            </div>
            {highlight && (
                <div className="absolute bottom-0 right-0 h-16 w-16 -translate-x-[-20%] -translate-y-[-20%] rounded-full bg-brand-500/5" />
            )}
        </Card>
    );
}
