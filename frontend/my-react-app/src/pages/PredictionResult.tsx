import { useEffect, useMemo, useState } from "react";
import { getStudentPredictions } from "../api/predict";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  Clock, 
  Target,
  ArrowRightCircle,
  GraduationCap
} from "lucide-react";

type LoadedPrediction = {
  studentCode: string;
  predictedGpa: number | null;
  category: string | null;
  confidence: number | null;
  riskLevel: string | null;
  recommendation: string | null;
  date: string;
};

function normalizeRisk(risk: string | null | undefined): "low" | "medium" | "high" {
  const value = (risk || "").toLowerCase();
  if (value.includes("high") || value.includes("critical")) {
    return "high";
  }
  if (value.includes("medium")) {
    return "medium";
  }
  return "low";
}

function confidenceToPercent(confidence: number | null | undefined): number {
  if (confidence === null || confidence === undefined) {
    return 0;
  }
  return confidence <= 1 ? confidence * 100 : confidence;
}


export default function PredictionResult() {
  const [studentCode, setStudentCode] = useState("");
  const [prediction, setPrediction] = useState<LoadedPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPrediction = async (code: string) => {
    if (!code.trim()) {
      setError("Enter a student code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await getStudentPredictions(code.trim());
      if (!payload.latest_prediction) {
        setPrediction(null);
        setError(payload.message || "No prediction found for this student.");
        return;
      }

      const latest = payload.latest_prediction;
      setPrediction({
        studentCode: payload.student_code,
        predictedGpa: latest.predicted_gpa,
        category: latest.category,
        confidence: latest.confidence,
        riskLevel: latest.risk_level,
        recommendation: latest.recommendation,
        date: latest.date,
      });
      localStorage.setItem("latest_prediction_student_code", payload.student_code);
    } catch (err) {
      setPrediction(null);
      setError(err instanceof Error ? err.message : "Failed to fetch prediction");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedCode = localStorage.getItem("latest_prediction_student_code");
    if (savedCode) {
      setStudentCode(savedCode);
      void loadPrediction(savedCode);
    }
  }, []);

  const score = useMemo(() => {
    if (!prediction?.predictedGpa && prediction?.predictedGpa !== 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, prediction.predictedGpa * 10));
  }, [prediction]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Prediction Result</h1>
        <p className="text-sm text-slate-500">Live model output loaded from database predictions.</p>
      </div>

      <Card>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadPrediction(studentCode);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            value={studentCode}
            onChange={(event) => setStudentCode(event.target.value)}
            placeholder="Enter student code"
            className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
          />
          <Button type="submit">Load Result</Button>
        </form>
      </Card>

      {loading && (
        <Card>
          <p className="text-sm text-slate-600">Loading prediction...</p>
        </Card>
      )}

      {error && (
        <Card className="border-l-4 border-l-red-500">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {prediction && !loading && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="relative overflow-hidden border-t-4 border-t-brand-600 bg-gradient-to-b from-brand-50/20 to-white">
            <div className="text-center py-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Success Probability Score</p>
              <div className="relative mt-6 inline-flex h-48 w-48 items-center justify-center">
                {/* Visual Gauge Concept */}
                <svg className="absolute h-full w-full rotate-[-90deg]">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    className="fill-none stroke-slate-100"
                    strokeWidth="12"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    className={`fill-none ${
                        score > 75 ? 'stroke-green-500' : score > 50 ? 'stroke-brand-500' : 'stroke-red-500'
                    } transition-all duration-1000 ease-out`}
                    strokeWidth="12"
                    strokeDasharray={552.92}
                    strokeDashoffset={552.92 - (552.92 * score) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <span className="text-5xl font-black tracking-tighter text-slate-900">{score.toFixed(0)}%</span>
                  <p className="mt-1 text-xs font-bold text-slate-500">Likely GPA: {prediction.predictedGpa?.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-center gap-3">
                <Badge variant={normalizeRisk(prediction.riskLevel)} className="px-4 py-1.5 text-sm uppercase font-bold">
                    {prediction.riskLevel} Risk
                </Badge>
                <div className="h-4 w-px bg-slate-200" />
                <Badge variant="info" className="px-4 py-1.5 text-sm font-bold">{prediction.studentCode}</Badge>
              </div>
            </div>
          </Card>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <StatsItem label="Category" value={prediction.category || "N/A"} icon={<TrendingUp className="h-5 w-5 text-indigo-500" />} />
            <StatsItem label="Model Confidence" value={`${confidenceToPercent(prediction.confidence).toFixed(1)}%`} icon={<Target className="h-5 w-5 text-brand-500" />} />
            <StatsItem label="Performance Trend" value={score > 50 ? "Stable/Positive" : "Immediate Attention"} icon={score > 50 ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-red-500" />} />
          </div>

          <div className="mt-8 space-y-6">
            <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Lightbulb className="h-6 w-6 text-brand-500" />
              Personalized Action Plan
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <RecommendationCard 
                title="Academic Strategy" 
                icon={<GraduationCap className="h-5 w-5 text-indigo-600" />}
                actions={[
                    prediction.predictedGpa && prediction.predictedGpa < 7.5 ? "Enroll in intensive tutoring sessions" : "Maintain current study rigor and peer mentorship",
                    "Focus on assignment weightage for upcoming finals",
                    "Schedule review meetings with specific subject teachers"
                ]}
              />
              <RecommendationCard 
                title="Behavioral Adjustments" 
                icon={<Clock className="h-5 w-5 text-brand-600" />}
                actions={[
                    "Improve early submission rates to avoid late penalties",
                    "Target 100% attendance in core morning sessions",
                    "Increase classroom participation in low-engagement courses"
                ]}
              />
            </div>

            <Card className="border-l-4 border-l-brand-600 bg-brand-50/30">
              <div className="flex gap-4">
                <div className="rounded-full bg-brand-100 p-2 h-fit">
                    <ArrowRightCircle className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900">Official AI Guidance</h4>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{prediction.recommendation}</p>
                    <p className="mt-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Prediction Generated: {new Date(prediction.date).toLocaleString()}
                    </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <Card className="flex items-center gap-4 py-4">
            <div className="rounded-xl bg-slate-50 p-2.5">{icon}</div>
            <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-lg font-bold text-slate-900">{value}</p>
            </div>
        </Card>
    );
}

function RecommendationCard({ title, icon, actions }: { title: string; icon: React.ReactNode; actions: string[] }) {
    return (
        <Card className="h-full border-none shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
                {icon}
                <h4 className="font-bold text-slate-800">{title}</h4>
            </div>
            <ul className="space-y-3">
                {actions.map((action, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-300 shrink-0" />
                        {action}
                    </li>
                ))}
            </ul>
        </Card>
    );
}
