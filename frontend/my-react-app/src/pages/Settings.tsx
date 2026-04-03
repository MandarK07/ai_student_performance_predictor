import Card from "../components/ui/Card";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">System configuration and preferences.</p>
      </div>
      <Card>
        <p className="text-slate-600">System settings will appear here.</p>
      </Card>
    </div>
  );
}
