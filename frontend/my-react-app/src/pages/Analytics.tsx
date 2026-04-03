import Card from "../components/ui/Card";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">System performance and usage trends.</p>
      </div>
      <Card>
        <p className="text-slate-600">Analytics charts will appear here.</p>
      </Card>
    </div>
  );
}
