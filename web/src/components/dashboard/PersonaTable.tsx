export interface PersonaRow {
  persona: string;
  posts: number;
  interactions: number;
  score: number;
}

interface PersonaTableProps {
  rows: PersonaRow[];
}

export function PersonaTable({ rows }: PersonaTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <div className="mt-6 text-sm text-gray-500">
        No persona usage recorded yet. Once signals start routing, persona data
        will appear here.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full text-sm border border-gray-200 bg-white rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-gray-600">Persona</th>
            <th className="px-3 py-2 text-left text-gray-600">Posts</th>
            <th className="px-3 py-2 text-left text-gray-600">Interactions</th>
            <th className="px-3 py-2 text-left text-gray-600">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-gray-200">
              <td className="px-3 py-2 text-gray-700">{row.persona}</td>
              <td className="px-3 py-2 text-gray-700">{row.posts}</td>
              <td className="px-3 py-2 text-gray-700">{row.interactions}</td>
              <td className="px-3 py-2 text-gray-700">{row.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}