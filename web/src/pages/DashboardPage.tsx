import { useEffect, useState } from "react";
import { AdminLayout } from "../components/layout/AdminLayout";
import { MetricCard } from "../components/dashboard/MetricCard";
import { LogsTable, LogEntry } from "../components/dashboard/LogsTable";
import { fetchMetrics, fetchLogs } from "../services/adminApi";

export function DashboardPage() {
  const [metrics, setMetrics] = useState({
    signals: 0,
    comments: 0,
    personas: 0,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, l] = await Promise.all([fetchMetrics(), fetchLogs()]);
        setMetrics(m);
        setLogs(l);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Signals (24h)" value={metrics.signals} />
        <MetricCard label="Comments Generated" value={metrics.comments} />
        <MetricCard label="Personas Active" value={metrics.personas} />
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-gray-500">Loading logs…</div>
      ) : (
        <LogsTable logs={logs} />
      )}
    </AdminLayout>
  );
}