import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, BarElement, Tooltip, Legend, Filler,
} from "chart.js";
import { TrendingUp, TrendingDown, Package, AlertTriangle, Truck, FolderOpen } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend, Filler);

const chartDefaults = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: "rgba(37,43,69,0.6)" }, ticks: { color: "#8892a4", font: { size: 11 } } },
    y: { grid: { color: "rgba(37,43,69,0.6)" }, ticks: { color: "#8892a4", font: { size: 11 } } },
  },
};

function KPICard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="card p-5 slide-in">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: trend >= 0 ? "var(--green)" : "var(--accent)" }}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-display font-bold" style={{ color: "var(--text)" }}>{value}</div>
      <div className="text-sm font-medium mt-0.5" style={{ color: "var(--text)" }}>{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: kpis } = useQuery({
    queryKey: ["kpis"],
    queryFn: () => api.get("/dashboard/kpis").then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts", "recent"],
    queryFn: () => api.get("/alerts?unread=true").then((r) => r.data.slice(0, 5)),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects").then((r) => r.data),
  });

  // Price trend mock data
  const labels = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  });

  const lineData = {
    labels,
    datasets: [
      {
        label: "Steel",
        data: labels.map((_, i) => 280 + Math.sin(i * 0.5) * 20 + i * 1.5),
        borderColor: "#e63946",
        backgroundColor: "rgba(230,57,70,0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#e63946",
      },
      {
        label: "Cement",
        data: labels.map((_, i) => 180 + Math.cos(i * 0.4) * 15 + i * 0.8),
        borderColor: "#4361ee",
        backgroundColor: "rgba(67,97,238,0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#4361ee",
      },
    ],
  };

  const donutData = {
    labels: ["Low Risk", "Medium Risk", "High Risk"],
    datasets: [{
      data: [
        Math.max(0, (kpis?.materials?.total || 10) - (kpis?.cortex?.high_risk_materials || 2) - 2),
        2,
        kpis?.cortex?.high_risk_materials || 2,
      ],
      backgroundColor: ["#2ec4b6", "#f4a261", "#e63946"],
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: ["BuildPro", "Apex", "KSC", "Mumbai Metro", "Chennai Hub"],
    datasets: [{
      label: "Reliability Score",
      data: [92.5, 87.3, 95.1, 81.2, 88.7],
      backgroundColor: ["#e63946", "#4361ee", "#2ec4b6", "#f4a261", "#8892a4"],
      borderRadius: 6,
    }],
  };

  const formatCurrency = (n) => {
    if (!n) return "₹0";
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${Number(n).toLocaleString()}`;
  };

  const severityStyle = {
    critical: "badge-red",
    high: "badge-red",
    medium: "badge-gold",
    low: "badge-muted",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text)" }}>
            Procurement Intelligence
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Real-time supply chain overview — Cortex powered
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: "rgba(46,196,182,0.1)", color: "var(--green)", border: "1px solid rgba(46,196,182,0.2)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: "var(--green)" }} />
          Cortex Live
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Estimated Cost"
          value={formatCurrency(kpis?.materials?.estimated_total_cost)}
          sub="Total material value"
          icon={TrendingUp}
          color="#e63946"
          trend={3.2}
        />
        <KPICard
          label="High-Risk Materials"
          value={kpis?.cortex?.high_risk_materials ?? "—"}
          sub="Require attention"
          icon={AlertTriangle}
          color="#f4a261"
          trend={-1.5}
        />
        <KPICard
          label="Best Supplier Score"
          value={kpis?.cortex?.avg_supplier_score ? `${kpis.cortex.avg_supplier_score}/100` : "—"}
          sub="Cortex weighted avg"
          icon={Truck}
          color="#2ec4b6"
        />
        <KPICard
          label="Active Projects"
          value={kpis?.projects?.active ?? "—"}
          sub={`${kpis?.projects?.total || 0} total`}
          icon={FolderOpen}
          color="#4361ee"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Price Trends */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>Price Trends (14 days)</h3>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: "#e63946" }} /> Steel
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: "#4361ee" }} /> Cement
              </span>
            </div>
          </div>
          <Line data={lineData} options={{ ...chartDefaults, responsive: true, maintainAspectRatio: true }} height={100} />
        </div>

        {/* Risk Distribution */}
        <div className="card p-5">
          <h3 className="font-display font-semibold mb-4" style={{ color: "var(--text)" }}>Risk Distribution</h3>
          <Doughnut
            data={donutData}
            options={{
              plugins: { legend: { position: "bottom", labels: { color: "#8892a4", font: { size: 11 } } } },
              cutout: "70%",
              responsive: true,
            }}
          />
        </div>
      </div>

      {/* Supplier scores + Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Supplier Bar Chart */}
        <div className="card p-5">
          <h3 className="font-display font-semibold mb-4" style={{ color: "var(--text)" }}>Supplier Reliability Scores</h3>
          <Bar
            data={barData}
            options={{
              ...chartDefaults,
              plugins: { legend: { display: false } },
              responsive: true,
              indexAxis: "y",
              scales: {
                x: { min: 70, max: 100, grid: { color: "rgba(37,43,69,0.6)" }, ticks: { color: "#8892a4", font: { size: 11 } } },
                y: { grid: { display: false }, ticks: { color: "#8892a4", font: { size: 11 } } },
              },
            }}
            height={120}
          />
        </div>

        {/* Live Alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>Live Alerts</h3>
            {alerts.length > 0 && (
              <span className="badge badge-red">{alerts.length} unread</span>
            )}
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>
                No active alerts — all systems normal ✓
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: "var(--surface)" }}
                >
                  <AlertTriangle size={15} style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div className="text-sm" style={{ color: "var(--text)" }}>{alert.message}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${severityStyle[alert.severity]}`}>{alert.severity}</span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card">
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>Active Projects</h3>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Location</th>
                <th>Budget</th>
                <th>Materials</th>
                <th>Alerts</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: "var(--muted)", textAlign: "center", padding: "32px" }}>
                    No projects yet — create your first project
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-medium" style={{ color: "var(--text)" }}>{p.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>{p.owner_name}</div>
                    </td>
                    <td style={{ color: "var(--muted)" }}>{p.location || "—"}</td>
                    <td style={{ color: "var(--text)" }}>{formatCurrency(p.total_budget)}</td>
                    <td>
                      <span className="badge badge-blue">{p.material_count || 0}</span>
                    </td>
                    <td>
                      {p.alert_count > 0
                        ? <span className="badge badge-red">{p.alert_count}</span>
                        : <span style={{ color: "var(--muted)" }}>—</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${
                        p.status === "active" ? "badge-green" :
                        p.status === "paused" ? "badge-gold" : "badge-muted"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
