import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  LayoutDashboard, FolderOpen, Package, Truck, Bell,
  Upload, LogOut, Wifi, WifiOff, Menu, X, ChevronRight
} from "lucide-react";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/projects", icon: FolderOpen, label: "Projects" },
  { path: "/materials", icon: Package, label: "Materials" },
  { path: "/suppliers", icon: Truck, label: "Suppliers" },
  { path: "/alerts", icon: Bell, label: "Alerts" },
  { path: "/upload", icon: Upload, label: "Upload BOQ" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { lastMessage, connected } = useWebSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (lastMessage && lastMessage.type === "live_alert") {
      toast(lastMessage.message, {
        icon: lastMessage.severity === "high" ? "🚨" : lastMessage.severity === "medium" ? "⚠️" : "ℹ️",
        duration: 5000,
      });
      setAlertCount((c) => c + 1);
    }
    if (lastMessage && lastMessage.type === "upload_complete") {
      toast.success(lastMessage.message);
    }
    if (lastMessage && lastMessage.type === "analysis_complete") {
      toast.success(lastMessage.message);
    }
  }, [lastMessage]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleColors = {
    admin: "badge-red",
    procurement: "badge-blue",
    project_manager: "badge-gold",
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-30 flex flex-col h-full w-64 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div className="px-6 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold"
              style={{ background: "var(--accent)" }}
            >
              🏗️
            </div>
            <div>
              <div className="font-display font-bold text-sm" style={{ color: "var(--text)", letterSpacing: "-0.3px" }}>
                ARENA ARCHITECT
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Supply Optimizer</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "text-white"
                    : "hover:bg-white/5"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: "rgba(230,57,70,0.15)", color: "var(--accent)", border: "1px solid rgba(230,57,70,0.2)" }
                  : { color: "var(--muted)", border: "1px solid transparent" }
              }
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {label === "Alerts" && alertCount > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--accent)", color: "white" }}
                >
                  {alertCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "var(--blue)", color: "white" }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{user?.name}</div>
              <span className={`badge ${roleColors[user?.role] || "badge-muted"}`} style={{ fontSize: "10px" }}>
                {user?.role?.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs" style={{ color: connected ? "var(--green)" : "var(--muted)" }}>
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {connected ? "Live" : "Offline"}
            </div>
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div
          className="lg:hidden flex items-center justify-between px-4 py-3"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
        >
          <button onClick={() => setSidebarOpen(true)} style={{ color: "var(--text)" }}>
            <Menu size={22} />
          </button>
          <span className="font-display font-bold text-sm" style={{ color: "var(--text)" }}>ARENA ARCHITECT</span>
          <div
            className="w-2 h-2 rounded-full pulse-dot"
            style={{ background: connected ? "var(--green)" : "var(--muted)" }}
          />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
