import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { LogsPage } from "./pages/LogsPage";
import { PersonaUsagePage } from "./pages/PersonaUsagePage";

export function App() {
  // TODO: Wire real auth when available. For now, assume access is already
  // restricted at the backend / infra layer for /admin.
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/logs" element={<LogsPage />} />
        <Route path="/admin/persona-usage" element={<PersonaUsagePage />} />
        {/* Default redirect if someone hits /admin directly */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}