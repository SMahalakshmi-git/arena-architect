import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";
import { Truck, Star, Clock, AlertTriangle } from "lucide-react";

export default function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.get("/suppliers").then((r) => r.data),
  });

  const getScoreColor = (score) => {
    if (score >= 90) return "var(--green)";
    if (score >= 80) return "var(--gold)";
    return "var(--accent)";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text)" }}>Suppliers</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
          {suppliers.length} registered suppliers — sorted by reliability
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading suppliers...</div>
      ) : (
        <>
          {/* Score cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((s, i) => (
              <div key={s.id} className="card p-5 slide-in">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{ background: "rgba(67,97,238,0.15)", color: "var(--blue)" }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-display font-bold" style={{ color: "var(--text)" }}>{s.name}</div>
                    <div className="text-sm flex items-center gap-1 mt-0.5" style={{ color: "var(--muted)" }}>
                      <Truck size={12} /> {s.region}
                    </div>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Reliability Score</span>
                    <span className="font-mono font-bold text-sm" style={{ color: getScoreColor(s.reliability_score) }}>
                      {s.reliability_score}/100
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${s.reliability_score}%`,
                        background: `linear-gradient(90deg, ${getScoreColor(s.reliability_score)}, ${getScoreColor(s.reliability_score)}80)`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div
                    className="rounded-lg p-2 text-center"
                    style={{ background: "var(--surface)" }}
                  >
                    <div className="font-bold" style={{ color: "var(--text)" }}>{s.total_deliveries}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>Total Deliveries</div>
                  </div>
                  <div
                    className="rounded-lg p-2 text-center"
                    style={{ background: "var(--surface)" }}
                  >
                    <div className="font-bold" style={{ color: "var(--green)" }}>
                      {s.on_time_rate || Math.round((s.on_time_deliveries / (s.total_deliveries || 1)) * 100)}%
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>On-Time Rate</div>
                  </div>
                </div>

                {s.contact_email && (
                  <div className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
                    ✉️ {s.contact_email}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="card">
            <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>Supplier Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Region</th>
                    <th>Reliability</th>
                    <th>Deliveries</th>
                    <th>On-Time Rate</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="font-medium" style={{ color: "var(--text)" }}>{s.name}</div>
                      </td>
                      <td style={{ color: "var(--muted)" }}>{s.region}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${s.reliability_score}%`, background: getScoreColor(s.reliability_score) }}
                            />
                          </div>
                          <span className="text-sm" style={{ color: "var(--text)" }}>{s.reliability_score}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--text)" }}>{s.total_deliveries}</td>
                      <td>
                        <span
                          style={{
                            color: s.on_time_rate >= 90 ? "var(--green)" : s.on_time_rate >= 80 ? "var(--gold)" : "var(--accent)",
                            fontWeight: 600,
                          }}
                        >
                          {s.on_time_rate || Math.round((s.on_time_deliveries / (s.total_deliveries || 1)) * 100)}%
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              style={{
                                color: i < Math.round(s.reliability_score / 20)
                                  ? "var(--gold)"
                                  : "var(--border)",
                                fill: i < Math.round(s.reliability_score / 20)
                                  ? "var(--gold)"
                                  : "transparent",
                              }}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
