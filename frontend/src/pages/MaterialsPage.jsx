import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";
import { Package, TrendingUp, TrendingDown } from "lucide-react";

const priorityColors = { low: "badge-muted", medium: "badge-blue", high: "badge-gold", critical: "badge-red" };
const riskColors = { low: "badge-green", medium: "badge-gold", high: "badge-red" };
const trendColors = { rising: "#e63946", stable: "#8892a4", falling: "#2ec4b6" };

export default function MaterialsPage() {
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["materials-all"],
    queryFn: () => api.get("/materials").then((r) => r.data),
  });

  const totalValue = materials.reduce((s, m) =>
    s + (Number(m.best_price || m.estimated_unit_price || 0) * Number(m.quantity || 0)), 0
  );

  const highRisk = materials.filter((m) => Number(m.best_score) < 75 && m.recommendation_count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text)" }}>All Materials</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            {materials.length} materials · Est. ₹{totalValue.toLocaleString()} total
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Materials", value: materials.length, color: "var(--blue)" },
          { label: "Analyzed", value: materials.filter((m) => m.recommendation_count > 0).length, color: "var(--green)" },
          { label: "High Risk", value: highRisk.length, color: "var(--accent)" },
          { label: "Pending Analysis", value: materials.filter((m) => m.recommendation_count == 0).length, color: "var(--gold)" },
        ].map((card) => (
          <div key={card.label} className="card p-4">
            <div className="text-2xl font-display font-bold" style={{ color: card.color }}>{card.value}</div>
            <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Materials Table */}
      <div className="card">
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>Material Inventory</h3>
        </div>
        {isLoading ? (
          <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading materials...</div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Est. Price</th>
                  <th>Best Price</th>
                  <th>Cortex Score</th>
                  <th>Priority</th>
                  <th>Suppliers</th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "var(--muted)", padding: "32px" }}>
                      No materials yet — add materials to a project or upload a BOQ
                    </td>
                  </tr>
                ) : (
                  materials.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Package size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
                          <div>
                            <div className="font-medium" style={{ color: "var(--text)" }}>{m.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--muted)" }}>{m.category || "—"}</td>
                      <td style={{ color: "var(--text)" }}>{m.quantity} {m.unit}</td>
                      <td style={{ color: "var(--muted)" }}>
                        {m.estimated_unit_price ? `₹${m.estimated_unit_price}` : "—"}
                      </td>
                      <td>
                        {m.best_price
                          ? <span style={{ color: "var(--green)", fontWeight: 600 }}>₹{Number(m.best_price).toFixed(2)}</span>
                          : <span style={{ color: "var(--muted)" }}>—</span>
                        }
                      </td>
                      <td>
                        {m.best_score ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${m.best_score}%`,
                                  background: m.best_score >= 80 ? "var(--green)" : m.best_score >= 65 ? "var(--gold)" : "var(--accent)",
                                }}
                              />
                            </div>
                            <span className="text-xs" style={{ color: "var(--muted)" }}>{Math.round(m.best_score)}</span>
                          </div>
                        ) : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>}
                      </td>
                      <td>
                        <span className={`badge ${priorityColors[m.priority] || "badge-muted"}`}>{m.priority}</span>
                      </td>
                      <td>
                        {m.recommendation_count > 0
                          ? <span className="badge badge-blue">{m.recommendation_count}</span>
                          : <span style={{ color: "var(--muted)", fontSize: 12 }}>None</span>
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
