import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "procurement" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (mode === "login") {
      result = await login(form.email, form.password);
    } else {
      result = await register(form.name, form.email, form.password, form.role);
    }
    if (result.success) {
      toast.success("Welcome to Arena Architect!");
      navigate("/dashboard");
    } else {
      toast.error(result.error);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-md slide-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "var(--accent)", boxShadow: "0 0 40px rgba(230,57,70,0.3)" }}
          >
            🏗️
          </div>
          <h1 className="font-display font-bold text-3xl" style={{ color: "var(--text)" }}>
            ARENA ARCHITECT
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Material Supply Optimizer — Powered by Cortex Intelligence
          </p>
        </div>

        <div className="card p-8">
          {/* Mode tabs */}
          <div
            className="flex rounded-lg p-1 mb-6"
            style={{ background: "var(--surface)" }}
          >
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize"
                style={
                  mode === m
                    ? { background: "var(--accent)", color: "white" }
                    : { color: "var(--muted)" }
                }
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label>Full Name</label>
                <input value={form.name} onChange={set("name")} placeholder="John Smith" required />
              </div>
            )}

            <div>
              <label>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="••••••••"
                required
              />
            </div>

            {mode === "register" && (
              <div>
                <label>Role</label>
                <select value={form.role} onChange={set("role")}>
                  <option value="procurement">Procurement</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {mode === "login" && (
            <div
              className="mt-4 p-3 rounded-lg text-xs space-y-1"
              style={{ background: "var(--surface)", color: "var(--muted)" }}
            >
              <div className="font-semibold mb-1" style={{ color: "var(--text)" }}>Demo Credentials:</div>
              <div>admin@arena.com / demo1234 (Admin)</div>
              <div>procurement@arena.com / demo1234 (Procurement)</div>
              <div>pm@arena.com / demo1234 (Project Manager)</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
