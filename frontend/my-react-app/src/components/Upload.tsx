import { useRef, useState } from "react";
import { uploadCSV, type UploadCsvResponse } from "../api/predict";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";
import DataTable from "./DataTable";

export default function Upload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<UploadCsvResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  const maxFileSizeMB = 2;

  const processFile = async (file: File) => {
    if (file.type !== "text/csv" && !file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      setError(`File size exceeds ${maxFileSizeMB}MB limit.`);
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setError(null);
    setUploadResult(null);

    try {
      const payload = await uploadCSV(file);
      setUploadResult(payload);
      if (!payload.results || payload.results.length === 0) {
        setError(payload.failed > 0 ? "Upload processed with errors." : "CSV uploaded but no prediction rows returned.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void processFile(file);
          }
        }}
        className="hidden"
      />

      <Card className="space-y-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) {
              void processFile(file);
            }
          }}
          className={[
            "flex h-48 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition",
            dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-white",
          ].join(" ")}
        >
          <p className="text-base font-semibold text-slate-900">Drop CSV file here or click to browse</p>
          <p className="mt-1 text-sm text-slate-500">Maximum file size: 2MB</p>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">{fileName ? `Selected: ${fileName}` : "No file selected"}</p>
          {loading ? <Badge variant="info">Uploading</Badge> : error ? <Badge variant="danger">Error</Badge> : <Badge variant="success">Ready</Badge>}
        </div>

        {loading && (
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-600" />
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => fileInputRef.current?.click()}>Choose File</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setUploadResult(null);
              setError(null);
              setFileName("");
            }}
          >
            Reset
          </Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Required columns</p>
          <p className="mt-1">
            student_code, gender, age, parent_education, attendance_rate, study_hours, previous_gpa, final_grade,
            assignment_score_avg, exam_score_avg, class_participation, late_submissions, previous_gpa_sem1, previous_gpa_sem2
          </p>
        </div>
      </Card>

      {uploadResult && (
        <Card className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Batch Processing Summary</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Records</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{uploadResult.total_records}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Successful</p>
              <p className="mt-1 text-lg font-semibold text-emerald-800">{uploadResult.success}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs uppercase tracking-wide text-red-700">Failed</p>
              <p className="mt-1 text-lg font-semibold text-red-800">{uploadResult.failed}</p>
            </div>
          </div>
        </Card>
      )}

      {uploadResult?.errors && uploadResult.errors.length > 0 && (
        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-900">Error Rows</h3>
          <DataTable
            data={uploadResult.errors.map((item) => ({
              row: item.row,
              student_code: item.student_code,
              error: item.error,
            }))}
          />
        </Card>
      )}

      {uploadResult?.results && uploadResult.results.length > 0 && (
        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-900">Prediction Results Preview</h3>
          <DataTable data={uploadResult.results as Array<Record<string, unknown>>} />
        </Card>
      )}
    </div>
  );
}
