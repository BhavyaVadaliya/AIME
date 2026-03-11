import { useEffect, useState } from "react";
import { AdminLayout } from "../components/layout/AdminLayout";
import {
  PersonaRow,
  PersonaTable,
} from "../components/dashboard/PersonaTable";
import { fetchPersonaUsage } from "../services/adminApi";

export function PersonaUsagePage() {
  const [rows, setRows] = useState<PersonaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetchPersonaUsage();
        setRows(r);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Persona Usage
      </h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading persona usage…</div>
      ) : (
        <PersonaTable rows={rows} />
      )}
    </AdminLayout>
  );
}