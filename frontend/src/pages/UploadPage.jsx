import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Upload, FileSpreadsheet, CheckCircle, X, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const [projectId, setProjectId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects").then((r) => r.data),
  });

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!projectId) return toast.error("Please select a project first");
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_id", projectId);

    try {
      const { data } = await api.post("/upload/boq", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult({ success: true, ...data });
      toast.success(`Parsed ${data.records_parsed} materials!`);
    } catch (err) {
      const error = err.response?.data?.error || "Upload failed";
      setResult({ success: false, error });
      toast.error(error);
    } finally {
      setUploading(false);
    }
  }, [projectId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "application/json": [".json"],
    },
    maxFiles: 1,
    disabled: uploading || !projectId,
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text)" }}>Upload BOQ / Material File</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
          Upload CSV, Excel, or JSON files to auto-import material schedules
        </p>
      </div>

      {/* Project Select */}
      <div className="card p-5">
        <label>Select Project *</label>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">— Choose a project —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className="card p-12 text-center transition-all"
        style={{
          borderStyle: "dashed",
          borderColor: isDragActive ? "var(--accent)" : "var(--border)",
          background: isDragActive ? "rgba(230,57,70,0.05)" : "var(--card)",
          cursor: !projectId || uploading ? "not-allowed" : "pointer",
          opacity: !projectId ? 0.5 : 1,
        }}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: isDragActive ? "rgba(230,57,70,0.15)" : "var(--surface)" }}
          >
            {uploading
              ? <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)" }} />
              : <Upload size={28} style={{ color: isDragActive ? "var(--accent)" : "var(--muted)" }} />
            }
          </div>
          <div>
            <div className="font-display font-semibold" style={{ color: "var(--text)" }}>
              {uploading ? "Uploading & parsing..." : isDragActive ? "Drop file here" : "Drag & drop your file"}
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              CSV, XLSX, XLS, or JSON · Max 10MB
            </div>
          </div>
          {!uploading && <button className="btn-secondary" style={{ pointerEvents: "none" }}>Browse Files</button>}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className="card p-5 slide-in"
          style={{
            borderColor: result.success ? "rgba(46,196,182,0.3)" : "rgba(230,57,70,0.3)",
            background: result.success ? "rgba(46,196,182,0.05)" : "rgba(230,57,70,0.05)",
          }}
        >
          <div className="flex items-start gap-3">
            {result.success
              ? <CheckCircle size={20} style={{ color: "var(--green)", flexShrink: 0 }} />
              : <AlertCircle size={20} style={{ color: "var(--accent)", flexShrink: 0 }} />
            }
            <div>
              <div className="font-semibold" style={{ color: "var(--text)" }}>
                {result.success ? "Upload Successful!" : "Upload Failed"}
              </div>
              {result.success
                ? (
                  <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                    {result.records_parsed} materials imported. Go to your project to run Cortex analysis.
                  </div>
                )
                : (
                  <div className="text-sm mt-1" style={{ color: "var(--accent)" }}>{result.error}</div>
                )
              }
            </div>
          </div>
        </div>
      )}

      {/* Template guide */}
      <div className="card p-5">
        <h3 className="font-display font-semibold mb-3" style={{ color: "var(--text)" }}>Expected File Format</h3>
        <div
          className="rounded-lg p-4 text-xs font-mono overflow-x-auto"
          style={{ background: "var(--surface)", color: "var(--muted)" }}
        >
          <div style={{ color: "var(--green)", marginBottom: 4 }}>// CSV Example (column headers):</div>
          <div>Material Name, Category, Unit, Quantity, Unit Price, Required By, Priority</div>
          <div style={{ color: "var(--text)" }}>Structural Steel, Steel, MT, 120, 85000, 2025-06-01, high</div>
          <div style={{ color: "var(--text)" }}>OPC Cement 53 Grade, Cement, bags, 5000, 380, 2025-05-15, critical</div>
          <div style={{ color: "var(--text)" }}>River Sand, Aggregate, m³, 800, 1200, 2025-05-20, medium</div>
          <br />
          <div style={{ color: "var(--green)", marginBottom: 4 }}>// JSON Example:</div>
          <div>{"[{"}</div>
          <div>{"  \"material_name\": \"Steel Rebar\","}</div>
          <div>{"  \"category\": \"Steel\","}</div>
          <div>{"  \"unit\": \"MT\","}</div>
          <div>{"  \"quantity\": 50,"}</div>
          <div>{"  \"unit_price\": 82000,"}</div>
          <div>{"  \"priority\": \"high\""}</div>
          <div>{"}"} ]</div>
        </div>
      </div>
    </div>
  );
}
