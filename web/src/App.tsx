import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { DashboardLitePage } from "./pages/DashboardLitePage";
import { LogsPage } from "./pages/LogsPage";
import { PersonaUsagePage } from "./pages/PersonaUsagePage";

export function App() {
  // TODO: Wire real auth when available. For now, assume access is already
  // restricted at the backend / infra layer for /admin.
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/dashboard-lite" element={<DashboardLitePage />} />
        <Route path="/admin/logs" element={<LogsPage />} />
        <Route path="/admin/persona-usage" element={<PersonaUsagePage />} />
        {/* Default redirect if someone hits /admin directly */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />
        {/* Default redirect for the root path so the client doesn't see a blank screen */}
        <Route
          path="/"
          element={<Navigate to="/admin/dashboard-lite" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}