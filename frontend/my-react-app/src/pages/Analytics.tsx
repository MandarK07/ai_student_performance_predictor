import { useEffect, useState } from "react";
import { fetchStudents, fetchStudentPerformance } from "../api/students";
import { getAtRiskStudents } from "../api/predict";
import Card from "../components/ui/Card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import CustomTooltip from "../components/charts/CustomTooltip";

type AnalyticsData = {
  gpaDistribution: { range: string; count: number }[];
  statusBreakdown: { name: string; value: number }[];
  riskLevels: { name: string; value: number }[];
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    
    const loadData = async () => {
      try {
        const [students, atRisk] = await Promise.all([fetchStudents({ limit: 500 }), getAtRiskStudents()]);
        
        const statusMap: Record<string, number> = {};
        students.forEach(s => {
          const status = (s.status || 'Unknown').charAt(0).toUpperCase() + (s.status || 'unknown').slice(1);
          statusMap[status] = (statusMap[status] || 0) + 1;
        });
        const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

        const uniqueHighRisk = new Set(atRisk.students.map(s => s.student_code));
        const riskLevels = [
          { name: "High Risk", value: uniqueHighRisk.size },
          { name: "Low Risk", value: Math.max(0, students.length - uniqueHighRisk.size) }
        ];

        const gpaCounts = { "0-1.0": 0, "1.0-2.0": 0, "2.0-3.0": 0, "3.0-4.0": 0 };
        
        const performanceByStudent = await Promise.all(
          students.map(async (student) => {
            try { return await fetchStudentPerformance(student.student_code); } catch { return null; }
          })
        );
        
        performanceByStudent.forEach((item) => {
          const gpa = item?.latest_prediction?.predicted_gpa ?? item?.academic_history?.[0]?.gpa;
          if (gpa !== undefined && gpa !== null) {
            if (gpa < 1) gpaCounts["0-1.0"]++;
            else if (gpa < 2) gpaCounts["1.0-2.0"]++;
            else if (gpa < 3) gpaCounts["2.0-3.0"]++;
            else gpaCounts["3.0-4.0"]++;
          }
        });
        
        const gpaDistribution = Object.entries(gpaCounts).map(([range, count]) => ({ range, count }));

        if (active) {
          setData({
            statusBreakdown,
            riskLevels,
            gpaDistribution
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load analytics data", err);
        if (active) setLoading(false);
      }
    };
    
    loadData();
    return () => { active = false; };
  }, []);

  const STATUS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];
  const RISK_COLORS = ['#ef4444', '#10b981'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Deep dive into student performance distributions and cohorts.</p>
      </div>

      {loading ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 animate-pulse">
           <Card className="h-80 bg-slate-100/50" />
           <Card className="h-80 bg-slate-100/50" />
           <Card className="h-80 bg-slate-100/50 lg:col-span-2" />
        </div>
      ) : data ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          
          {/* Risk Level Chart */}
          <Card className="flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Global Risk Assessment</h2>
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={data.riskLevels}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.riskLevels.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} className="hover:opacity-80 outline-none" />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Student Status Breakdown */}
          <Card className="flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Enrollment Status Breakdown</h2>
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={data.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {data.statusBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} className="hover:opacity-90 outline-none" />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* GPA Distribution Histogram */}
          <Card className="lg:col-span-2 flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">GPA Distribution (Current Cohort)</h2>
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gpaDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="range" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 13 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 13 }} 
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="count" name="Students" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={50} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      ) : (
        <Card>
          <p className="text-center text-slate-500 py-8">No data available to display currently.</p>
        </Card>
      )}
    </div>
  );
}
