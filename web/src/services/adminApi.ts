import type { LogEntry } from "../components/dashboard/LogsTable";
import type { PersonaRow } from "../components/dashboard/PersonaTable";

const BASE = "/admin";

export async function fetchMetrics(): Promise<{
  signals: number;
  comments: number;
  personas: number;
}> {
  const res = await fetch(`${BASE}/metrics`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  const data = await res.json();
  return {
    signals: data.signalsLast24h ?? 0,
    comments: data.commentsGenerated ?? 0,
    personas: data.personasActive ?? 0,
  };
}

export async function fetchLogs(): Promise<LogEntry[]> {
  const res = await fetch(`${BASE}/logs`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  const data = await res.json();
  // assuming { items: [...] }
  return data.items ?? [];
}

export async function fetchPersonaUsage(): Promise<PersonaRow[]> {
  const res = await fetch(`${BASE}/persona-usage`);
  if (!res.ok) throw new Error("Failed to fetch persona usage");
  const data = await res.json();
  // assuming { personas: [...] }
  return data.personas ?? [];
}