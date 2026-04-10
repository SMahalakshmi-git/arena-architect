import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Bell, CheckCheck, AlertTriangle, TrendingUp, Truck, Package } from "lucide-react";

const alertIcons = {
  price_spike: TrendingUp,
  shortage: Package,
  delivery_delay: Truck,
  supplier_risk: AlertTriangle,
};

const severityStyle = {
  critical: { badge: "badge-red", bg: "rgba(230,57,70,0.05)", border: "rgba(230,57,70,0.2)" },
  high: { badge: "badge-red", bg: "rgba(230,57,70,0.05)", border: "rgba(230,57,70,0.15)" },
  medium: { badge: "badge-gold", bg: "rgba(244,162,97,0.05)", border: "rgba(244,162,97,0.15)" },
  low: { badge: "badge-muted", bg: "rgba(136,146,164,0.05)", border: "rgba(136,146,164,0.15)" },
};

export default function AlertsPage() {
  const qc = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.get("/alerts").then((r) => r.data),
    refetchInterval: 15000,
  });

  const markRead = useMutation({
    mutationFn: (id) => api.put(`/alerts/${id}/read`),
    onSuccess: () => qc.invalidateQueries(["alerts"]),
  });

  const markAll = useMutation({
    mutationFn: () => api.put("/alerts/read-all"),
    onSuccess: () => { qc.invalidateQueries(["alerts"]); toast.success("All alerts marked as read"); },
  });

  const unread = alerts.filter((a) => !a.is_read);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text)" }}>Risk Alerts</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            {unread.length} unread · {alerts.length} total
          </p>
        </div>
        {unread.length > 0 && (
          <button className="btn-secondary" onClick={() => markAll.mutate()}>
            <CheckCheck size={15} /> Mark All Read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell size={40} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
          <div className="font-semibold" style={{ color: "var(--text)" }}>No alerts</div>
          <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Run a Cortex analysis to generate supply chain alerts
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const style = severityStyle[alert.severity] || severityStyle.low;
            const Icon = alertIcons[alert.alert_type] || AlertTriangle;
            return (
              <div
                key={alert.id}
                className="card p-4 slide-in flex items-start gap-4"
                style={{
                  background: style.bg,
                  borderColor: alert.is_read ? "var(--border)" : style.border,
                  opacity: alert.is_read ? 0.6 : 1,
                  transition: "opacity 0.3s",
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${style.border.replace("0.2", "0.15")}` }}
                >
                  <Icon size={17} style={{ color: alert.severity === "low" ? "var(--muted)" : alert.severity === "medium" ? "var(--gold)" : "var(--accent)" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{alert.message}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`badge ${style.badge}`}>{alert.severity}</span>
                        <span className="badge badge-muted">{alert.alert_type?.replace("_", " ")}</span>
                        {alert.project_name && (
                          <span className="text-xs" style={{ color: "var(--muted)" }}>📁 {alert.project_name}</span>
                        )}
                        {alert.material_name && (
                          <span className="text-xs" style={{ color: "var(--muted)" }}>🔩 {alert.material_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {new Date(alert.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {!alert.is_read && (
                        <button
                          className="badge badge-green"
                          style={{ cursor: "pointer" }}
                          onClick={() => markRead.mutate(alert.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
