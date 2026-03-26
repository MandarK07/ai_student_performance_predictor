import { useEffect, useMemo, useState } from "react";
import { getStudentPredictions } from "../api/predict";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

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

function progressClass(score: number): string {
  if (score >= 90) return "w-11/12";
  if (score >= 80) return "w-10/12";
  if (score >= 70) return "w-9/12";
  if (score >= 60) return "w-8/12";
  if (score >= 50) return "w-7/12";
  if (score >= 40) return "w-6/12";
  if (score >= 30) return "w-5/12";
  if (score >= 20) return "w-4/12";
  if (score >= 10) return "w-3/12";
  if (score > 0) return "w-2/12";
  return "w-0";
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
        <>
          <Card className="text-center">
            <p className="text-sm font-medium text-slate-500">Predicted Success Score</p>
            <p className="mt-3 text-6xl font-black text-brand-700">{score.toFixed(1)}%</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Badge variant={normalizeRisk(prediction.riskLevel)}>{prediction.riskLevel || "Unknown"} Risk</Badge>
              <Badge variant="info">{prediction.studentCode}</Badge>
            </div>

            <div className="mx-auto mt-6 h-3 w-full max-w-xl overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full bg-brand-600 transition-all duration-700 ${progressClass(score)}`} />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Prediction Details</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Predicted GPA</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{prediction.predictedGpa?.toFixed(2) || "N/A"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{prediction.category || "N/A"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Confidence</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{confidenceToPercent(prediction.confidence).toFixed(2)}%</p>
              </div>
            </div>

            <h3 className="mt-5 text-base font-semibold text-slate-900">AI Recommendation</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{prediction.recommendation || "No recommendation available."}</p>
            <p className="mt-2 text-xs text-slate-500">Prediction Date: {new Date(prediction.date).toLocaleString()}</p>
          </Card>
        </>
      )}
    </div>
  );
}
