import { NavLink } from "react-router-dom";

export function Sidebar() {
  const baseClasses = "block px-4 py-2 rounded hover:bg-gray-800";
  const activeClasses = "bg-gray-800";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-gray-100 flex flex-col">
      <div className="px-6 py-4 border-b border-gray-800 text-lg font-semibold">
        AIME Admin
      </div>
      <nav className="mt-4 flex-1 px-2 space-y-1 text-sm">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `${baseClasses} ${isActive ? activeClasses : ""}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/admin/logs"
          className={({ isActive }) =>
            `${baseClasses} ${isActive ? activeClasses : ""}`
          }
        >
          Logs
        </NavLink>
        <NavLink
          to="/admin/persona-usage"
          className={({ isActive }) =>
            `${baseClasses} ${isActive ? activeClasses : ""}`
          }
        >
          Persona Usage
        </NavLink>
      </nav>
      <div className="px-4 py-3 text-xs text-gray-500 border-t border-gray-800">
        Sprint-4 · MVP
      </div>
    </aside>
  );
}