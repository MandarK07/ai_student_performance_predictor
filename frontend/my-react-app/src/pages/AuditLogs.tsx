import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import { apiFetch } from "../api/http";

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await apiFetch("/admin/audit-logs");
        const data = await res.json();
        if (Array.isArray(data)) setLogs(data);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500">System-wide action history.</p>
      </div>

      <Card>
        {loading ? <p>Loading logs...</p> : (
          <div className="space-y-4">
             {logs.map((log) => (
                <div key={log.log_id} className="border-b pb-2">
                    <p className="text-sm font-medium text-slate-900">Action: {log.action}</p>
                    <p className="text-xs text-slate-500">Table: {log.table_name || "N/A"} - User ID: {log.user_id}</p>
                    <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
                </div>
             ))}
          </div>
        )}
      </Card>
    </div>
  );
}
