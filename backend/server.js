require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const httpServer = createServer(app);

// WebSocket Server
const wss = new WebSocket.Server({ server: httpServer, path: "/ws" });

// Store connected clients
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("WebSocket client connected");

  ws.on("close", () => {
    clients.delete(ws);
    console.log("WebSocket client disconnected");
  });

  ws.send(JSON.stringify({ type: "connected", message: "Arena Architect Live Feed Active" }));
});

// Broadcast to all WebSocket clients
global.broadcast = (data) => {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/projects", require("./routes/projects"));
app.use("/materials", require("./routes/materials"));
app.use("/suppliers", require("./routes/suppliers"));
app.use("/alerts", require("./routes/alerts"));
app.use("/upload", require("./routes/upload"));
app.use("/cortex", require("./routes/cortex"));
app.use("/reports", require("./routes/reports"));
app.use("/dashboard", require("./routes/dashboard"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Arena Architect API", timestamp: new Date() });
});

// Simulate periodic live alerts (demo)
setInterval(() => {
  const alerts = [
    { type: "live_alert", severity: "high", message: "Steel prices rising 3.2% in South India region" },
    { type: "live_alert", severity: "medium", message: "Cement availability low in Karnataka — consider alternate suppliers" },
    { type: "live_alert", severity: "low", message: "Supplier 'BuildPro' confirmed delivery schedule on time" },
  ];
  const alert = alerts[Math.floor(Math.random() * alerts.length)];
  global.broadcast(alert);
}, 30000);

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Arena Architect API running on port ${PORT}`);
});
