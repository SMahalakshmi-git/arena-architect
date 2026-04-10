import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Plus, FolderOpen, MapPin, Calendar, DollarSign, X, Trash2, ExternalLink } from "lucide-react";

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

export default function ProjectsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", location: "", start_date: "", end_date: "", total_budget: "" });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (data) => api.post("/projects", data),
    onSuccess: () => {
      qc.invalidateQueries(["projects"]);
      toast.success("Project created!");
      setShowModal(false);
      setForm({ name: "", description: "", location: "", start_date: "", end_date: "", total_budget: "" });
    },
    onError: (e) => toast.error(e.response?.data?.error || "Failed"),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries(["projects"]); toast.success("Project deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); create.mutate(form); };

  const statusColors = { active: "badge-green", paused: "badge-gold", planning: "badge-blue", completed: "badge-muted" };

  const formatCurrency = (n) => {
    if (!n) return "—";
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${Number(n).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text)" }}>Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{projects.length} total projects</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <div
          className="card p-16 text-center"
          onClick={() => setShowModal(true)}
          style={{ cursor: "pointer", borderStyle: "dashed" }}
        >
          <FolderOpen size={40} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
          <div className="font-semibold" style={{ color: "var(--text)" }}>No projects yet</div>
          <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>Click to create your first project</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="card p-5 slide-in group" style={{ cursor: "pointer" }}>
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(67,97,238,0.15)" }}
                >
                  <FolderOpen size={20} style={{ color: "var(--blue)" }} />
                </div>
                <span className={`badge ${statusColors[p.status] || "badge-muted"}`}>{p.status}</span>
              </div>

              <h3
                className="font-display font-bold text-lg mb-1 hover:text-red-400 transition-colors"
                style={{ color: "var(--text)" }}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                {p.name}
              </h3>
              <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--muted)" }}>{p.description || "No description"}</p>

              <div className="space-y-1.5 text-sm" style={{ color: "var(--muted)" }}>
                {p.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={13} /> {p.location}
                  </div>
                )}
                {p.total_budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={13} /> {formatCurrency(p.total_budget)}
                  </div>
                )}
                {p.start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar size={13} />
                    {new Date(p.start_date).toLocaleDateString("en-IN")}
                    {p.end_date && ` → ${new Date(p.end_date).toLocaleDateString("en-IN")}`}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="badge badge-blue">{p.material_count || 0} materials</span>
                  {p.alert_count > 0 && <span className="badge badge-red">{p.alert_count} alerts</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary"
                    style={{ padding: "5px 10px", fontSize: "12px" }}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <ExternalLink size={12} /> View
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: "5px 10px", fontSize: "12px", color: "var(--accent)", borderColor: "rgba(230,57,70,0.3)" }}
                    onClick={() => {
                      if (confirm("Delete this project?")) del.mutate(p.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Project">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label>Project Name *</label><input value={form.name} onChange={set("name")} placeholder="Bengaluru Metro Phase 3" required /></div>
          <div><label>Description</label><textarea value={form.description} onChange={set("description")} placeholder="Project overview..." rows={3} /></div>
          <div><label>Location</label><input value={form.location} onChange={set("location")} placeholder="Bengaluru, Karnataka" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label>Start Date</label><input type="date" value={form.start_date} onChange={set("start_date")} /></div>
            <div><label>End Date</label><input type="date" value={form.end_date} onChange={set("end_date")} /></div>
          </div>
          <div><label>Total Budget (₹)</label><input type="number" value={form.total_budget} onChange={set("total_budget")} placeholder="5000000" /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={create.isPending}>
              {create.isPending ? "Creating..." : "Create Project"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
