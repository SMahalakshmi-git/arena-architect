import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import toast from "react-hot-toast";
import { ArrowLeft, Zap, Download, Plus, X, Star, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="card w-full max-w-lg slide-in" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-display font-bold" style={{ color: "var(--text)" }}>{title}</h3>
          <button onClick={onClose} style={{ color: "var(--muted)" }}><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const riskBadge = { low: "badge-green", medium: "badge-gold", high: "badge-red" };
const trendIcon = { rising: <TrendingUp size={12} style={{ color: "#e63946" }} />, stable: null, falling: <TrendingDown size={12} style={{ color: "#2ec4b6" }} /> };

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [activeRec, setActiveRec] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", unit: "nos", quantity: "", estimated_unit_price: "", priority: "medium", required_by: "" });

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data),
  });

  const { data: materials = [], refetch: refetchMaterials } = useQuery({
    queryKey: ["materials", id],
    queryFn: () => api.get(`/materials?project_id=${id}`).then((r) => r.data),
  });

  const addMaterial = useMutation({
    mutationFn: (data) => api.post("/materials", { ...data, project_id: id }),
    onSuccess: () => {
      qc.invalidateQueries(["materials", id]);
      toast.success("Material added!");
      setShowModal(false);
      setForm({ name: "", category: "", unit: "nos", quantity: "", estimated_unit_price: "", priority: "medium", required_by: "" });
    },
  });

  const deleteMaterial = useMutation({
    mutationFn: (mid) => api.delete(`/materials/${mid}`),
    onSuccess: () => { qc.invalidateQueries(["materials", id]); toast.success("Material removed"); },
  });

  const runCortex = async () => {
    const ids = selectedMaterials.length > 0 ? selectedMaterials : materials.map((m) => m.id);
    if (!ids.length) return toast.error("No materials to analyze");
    setAnalyzing(true);
    try {
      await api.post("/cortex/analyze", { material_ids: ids, project_id: id });
      toast.success(`Cortex analysis complete for ${ids.length} materials`);
      refetchMaterials();
    } catch {
      toast.error("Cortex analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadReport = () => {
    window.open(`/api/reports/procurement-summary/${id}`, "_blank");
  };

  const { data: recommendations = [] } = useQuery({
    queryKey: ["recs", activeRec],
    queryFn: () => api.get(`/materials/${activeRec}/recommendations`).then((r) => r.data),
    enabled: !!activeRec,
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const priorityBadge = { low: "badge-muted", medium: "badge-blue", high: "badge-gold", critical: "badge-red" };

  const totalEstimated = materials.reduce((s, m) => s + (Number(m.best_price || m.estimated_unit_price) * Number(m.quantity || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2 text-sm mb-2"
            style={{ color: "var(--muted)" }}
          >
            <ArrowLeft size={14} /> Back to Projects
          </button>
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text)" }}>
            {project?.name || "Loading..."}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            {project?.location} · {materials.length} materials · Est. ₹{totalEstimated.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary" onClick={downloadReport}>
            <Download size={15} /> PDF Report
          </button>
          <button
            className="btn-primary"
            onClick={runCortex}
            disabled={analyzing}
            style={{ background: analyzing ? "var(--border)" : "var(--blue)" }}
          >
            <Zap size={15} />
            {analyzing ? "Analyzing..." : "Run Cortex Analysis"}
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Material
          </button>
        </div>
      </div>

      {/* Materials Table */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>Bill of Quantities</h3>
          {selectedMaterials.length > 0 && (
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {selectedMaterials.length} selected
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    style={{ width: "auto" }}
                    onChange={(e) => setSelectedMaterials(e.target.checked ? materials.map((m) => m.id) : [])}
                  />
                </th>
                <th>Material</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Est. Price</th>
                <th>Best Price</th>
                <th>Priority</th>
                <th>Recs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: "32px" }}>
                    No materials — add items or upload a BOQ file
                  </td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <input
                        type="checkbox"
                        style={{ width: "auto" }}
                        checked={selectedMaterials.includes(m.id)}
                        onChange={(e) => setSelectedMaterials(
                          e.target.checked
                            ? [...selectedMaterials, m.id]
                            : selectedMaterials.filter((x) => x !== m.id)
                        )}
                      />
                    </td>
                    <td>
                      <div className="font-medium" style={{ color: "var(--text)" }}>{m.name}</div>
                      {m.required_by && (
                        <div className="text-xs" style={{ color: "var(--muted)" }}>
                          By {new Date(m.required_by).toLocaleDateString("en-IN")}
                        </div>
                      )}
                    </td>
                    <td style={{ color: "var(--muted)" }}>{m.category || "—"}</td>
                    <td style={{ color: "var(--text)" }}>{m.quantity} {m.unit}</td>
                    <td style={{ color: "var(--muted)" }}>₹{m.estimated_unit_price || "—"}</td>
                    <td>
                      {m.best_price
                        ? <span style={{ color: "var(--green)", fontWeight: 600 }}>₹{Number(m.best_price).toFixed(2)}</span>
                        : <span style={{ color: "var(--muted)" }}>Pending</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${priorityBadge[m.priority] || "badge-muted"}`}>{m.priority}</span>
                    </td>
                    <td>
                      {m.recommendation_count > 0 ? (
                        <button
                          className="badge badge-blue"
                          style={{ cursor: "pointer" }}
                          onClick={() => setActiveRec(activeRec === m.id ? null : m.id)}
                        >
                          {m.recommendation_count} suppliers
                        </button>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>None</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => { if (confirm("Remove this material?")) deleteMaterial.mutate(m.id); }}
                        style={{ color: "var(--muted)" }}
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations Panel */}
      {activeRec && recommendations.length > 0 && (
        <div className="card p-5 slide-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>
              Supplier Recommendations — {materials.find((m) => m.id === activeRec)?.name}
            </h3>
            <button onClick={() => setActiveRec(null)} style={{ color: "var(--muted)" }}><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl p-4"
                style={{
                  background: "var(--surface)",
                  border: rec.recommended
                    ? "1px solid rgba(46,196,182,0.4)"
                    : "1px solid var(--border)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{rec.supplier_name}</div>
                  {rec.recommended && <Star size={14} style={{ color: "var(--gold)" }} />}
                </div>
                <div className="text-xl font-display font-bold" style={{ color: "var(--accent)" }}>
                  ₹{Number(rec.unit_price).toFixed(2)}
                </div>
                <div className="space-y-1 mt-2 text-xs" style={{ color: "var(--muted)" }}>
                  <div className="flex justify-between">
                    <span>Cortex Score</span>
                    <span style={{ color: "var(--text)" }}>{rec.cortex_score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span style={{ color: "var(--text)" }}>{rec.delivery_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Availability</span>
                    <span style={{ color: "var(--text)" }}>{rec.availability_score}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`badge ${riskBadge[rec.risk_level]}`}>{rec.risk_level} risk</span>
                    <span className="flex items-center gap-1">
                      {trendIcon[rec.price_trend]}
                      {rec.price_trend}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Material">
        <form onSubmit={(e) => { e.preventDefault(); addMaterial.mutate(form); }} className="space-y-4">
          <div><label>Material Name *</label><input value={form.name} onChange={set("name")} placeholder="Structural Steel" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label>Category</label><input value={form.category} onChange={set("category")} placeholder="Steel" /></div>
            <div><label>Unit</label>
              <select value={form.unit} onChange={set("unit")}>
                {["nos", "kg", "MT", "m³", "m²", "m", "bags", "litre", "set"].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label>Quantity</label><input type="number" value={form.quantity} onChange={set("quantity")} placeholder="500" /></div>
            <div><label>Est. Unit Price (₹)</label><input type="number" value={form.estimated_unit_price} onChange={set("estimated_unit_price")} placeholder="250" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label>Priority</label>
              <select value={form.priority} onChange={set("priority")}>
                {["low", "medium", "high", "critical"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label>Required By</label><input type="date" value={form.required_by} onChange={set("required_by")} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={addMaterial.isPending}>
              {addMaterial.isPending ? "Adding..." : "Add Material"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
