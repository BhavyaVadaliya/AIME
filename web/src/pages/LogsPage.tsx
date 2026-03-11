import { useEffect, useState } from "react";
import { AdminLayout } from "../components/layout/AdminLayout";
import { LogsTable, LogEntry } from "../components/dashboard/LogsTable";
import { fetchLogs } from "../services/adminApi";

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const l = await fetchLogs();
        setLogs(l);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Logs</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading logs…</div>
      ) : (
        <LogsTable logs={logs} />
      )}
    </AdminLayout>
  );
}