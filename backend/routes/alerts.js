const express = require("express");
const pool = require("../db/pool");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /alerts
router.get("/", authenticate, async (req, res) => {
  const { project_id, unread } = req.query;
  try {
    let query = `
      SELECT ra.*, p.name as project_name, m.name as material_name
      FROM risk_alerts ra
      LEFT JOIN projects p ON ra.project_id = p.id
      LEFT JOIN materials m ON ra.material_id = m.id
      WHERE 1=1
    `;
    const params = [];
    if (project_id) { params.push(project_id); query += ` AND ra.project_id = $${params.length}`; }
    if (unread === "true") { query += " AND ra.is_read = false"; }
    query += " ORDER BY ra.created_at DESC LIMIT 100";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// PUT /alerts/:id/read
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    await pool.query("UPDATE risk_alerts SET is_read = true WHERE id = $1", [req.params.id]);
    res.json({ message: "Alert marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update alert" });
  }
});

// PUT /alerts/read-all
router.put("/read-all", authenticate, async (req, res) => {
  try {
    await pool.query("UPDATE risk_alerts SET is_read = true");
    res.json({ message: "All alerts marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update alerts" });
  }
});

module.exports = router;
