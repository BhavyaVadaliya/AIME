export interface LogEntry {
  timestamp: string;
  persona: string;
  action: string;
  meta: string;
}

interface LogsTableProps {
  logs: LogEntry[];
}

export function LogsTable({ logs }: LogsTableProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="mt-6 text-sm text-gray-500">
        No logs available yet. Once AIME starts processing activity, entries
        will appear here.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full text-sm border border-gray-200 bg-white rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-gray-600">Timestamp</th>
            <th className="px-3 py-2 text-left text-gray-600">Persona</th>
            <th className="px-3 py-2 text-left text-gray-600">Action</th>
            <th className="px-3 py-2 text-left text-gray-600">Meta</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={idx} className="border-t border-gray-200">
              <td className="px-3 py-2 text-gray-700">{log.timestamp}</td>
              <td className="px-3 py-2 text-gray-700">{log.persona}</td>
              <td className="px-3 py-2 text-gray-700">{log.action}</td>
              <td className="px-3 py-2 text-gray-700">{log.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}