import Card from "../components/ui/Card";

export default function About() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">About This Platform</h1>
        <p className="text-sm text-slate-500">AI-enabled analytics to predict student outcomes and drive early interventions.</p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">What It Does</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The platform combines academic metrics, attendance, behavioral signals, and model inference to estimate student performance and risk level.
          It supports individual predictions, bulk CSV pipelines, and actionable recommendation feeds.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Frontend</h3>
          <p className="mt-1 text-sm text-slate-600">React, Vite, TypeScript, Tailwind CSS dashboard UI.</p>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Backend</h3>
          <p className="mt-1 text-sm text-slate-600">FastAPI APIs for auth, prediction, CSV ingestion, and profile retrieval.</p>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Modeling</h3>
          <p className="mt-1 text-sm text-slate-600">Machine learning workflows for performance estimation and risk categorization.</p>
        </Card>
      </div>
    </div>
  );
}
