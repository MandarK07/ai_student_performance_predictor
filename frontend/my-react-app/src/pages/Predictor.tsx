import { useState } from "react";
import { fetchPrediction, type PredictionRequest, type PredictionResponse } from "../api/predict";
import InputForm from "../components/InputForm";
import type { PredictorFormData } from "../components/InputForm";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";

type PredictorProps = {
  onPrediction?: (studentName: string, score: number) => void;
};

function toRiskVariant(risk: string | null | undefined): "low" | "medium" | "high" {
  const value = (risk || "").toLowerCase();
  if (value.includes("high") || value.includes("critical")) {
    return "high";
  }
  if (value.includes("medium")) {
    return "medium";
  }
  return "low";
}

export default function Predictor({ onPrediction }: PredictorProps) {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PredictorFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchPrediction(data as PredictionRequest);
      setResult(response);
      localStorage.setItem("latest_prediction_student_code", response.student_code);
      onPrediction?.(data.student_code || "Unknown", response.predicted_gpa || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Predict Student Performance</h1>
        <p className="text-sm text-slate-500">Submit student signals to generate an AI-based academic performance prediction.</p>
      </div>

      <Card>
        <InputForm onSubmit={handleSubmit} />
      </Card>

      {loading && (
        <Card>
          <p className="text-sm text-slate-600">Generating prediction...</p>
        </Card>
      )}

      {error && (
        <Card className="border-l-4 border-l-red-500">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </Card>
      )}

      {result && !loading && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Prediction Output</h2>
            <Badge variant={toRiskVariant(result.risk_level)}>{result.risk_level || "Unknown"} Risk</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500">Student Code</p>
              <p className="mt-1 font-semibold text-slate-900">{result.student_code}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500">Predicted GPA</p>
              <p className="mt-1 text-xl font-bold text-brand-700">{result.predicted_gpa.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
              <p className="mt-1 font-semibold text-slate-900">{result.predicted_category}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500">Confidence</p>
              <p className="mt-1 font-semibold text-slate-900">{result.confidence_score.toFixed(2)}%</p>
            </div>
          </div>

          {result.recommendation && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Recommendation</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{result.recommendation}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
