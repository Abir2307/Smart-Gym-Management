import { NavLink, Outlet } from "react-router-dom";
import { navSections, rolePermissions } from "../data/navigation";
import { useAuth } from "../auth/useAuth";

export function AppLayout() {
  const { user, logout } = useAuth();
  const allowedLabels = rolePermissions[user.role] || [];
  const visibleSections = navSections.filter((section) => allowedLabels.includes(section.label));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <span className="brand-icon">SG</span>
          <div>
            <p>Smart Gym</p>
            <strong>Management System</strong>
          </div>
        </div>

        <div className="sidebar-meta">
          <span className="pill pill-success">{user.role}</span>
          <p>{user.fullName}</p>
        </div>

        <nav className="nav-menu" aria-label="Dashboard sections">
          {visibleSections.map((section) => (
            <NavLink key={section.path} to={section.path} className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
              {section.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="ghost-button sidebar-button" onClick={logout}>
          Sign out
        </button>
      </aside>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}
