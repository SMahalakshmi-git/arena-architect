const express = require("express");
const pool = require("../db/pool");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /dashboard/kpis
router.get("/kpis", authenticate, async (req, res) => {
  try {
    const [projects, materials, alerts, suppliers] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='active') as active FROM projects"),
      pool.query(`
        SELECT COUNT(*) as total,
          SUM(quantity * estimated_unit_price) as estimated_cost,
          COUNT(*) FILTER (WHERE priority = 'critical') as critical_count,
          COUNT(*) FILTER (WHERE priority = 'high') as high_count
        FROM materials
      `),
      pool.query(`
        SELECT COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_read = false) as unread,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical
        FROM risk_alerts
      `),
      pool.query("SELECT COUNT(*) as total, MAX(reliability_score) as best_score, AVG(reliability_score) as avg_score FROM suppliers"),
    ]);

    const criticalCount = parseInt(materials.rows[0].critical_count) || 0;
    const highCount = parseInt(materials.rows[0].high_count) || 0;
    const highRiskTotal = criticalCount + highCount;

    res.json({
      projects: {
        total: parseInt(projects.rows[0].total),
        active: parseInt(projects.rows[0].active),
      },
      materials: {
        total: parseInt(materials.rows[0].total),
        estimated_total_cost: parseFloat(materials.rows[0].estimated_cost) || 0,
        critical_count: criticalCount,
        high_risk_count: highRiskTotal,
      },
      alerts: {
        total: parseInt(alerts.rows[0].total),
        unread: parseInt(alerts.rows[0].unread),
        critical: parseInt(alerts.rows[0].critical),
      },
      suppliers: {
        total: parseInt(suppliers.rows[0].total),
        avg_reliability: parseFloat(suppliers.rows[0].avg_score || 0).toFixed(1),
        best_score: parseFloat(suppliers.rows[0].best_score || 0).toFixed(1),
      },
      cortex: {
        avg_supplier_score: parseFloat(suppliers.rows[0].best_score || 0).toFixed(1),
        high_risk_materials: highRiskTotal,
        best_available_price: 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch KPIs" });
  }
});

// GET /dashboard/recent-activity
router.get("/recent-activity", authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      (SELECT 'alert' as type, message as description, created_at, severity as meta FROM risk_alerts ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'upload' as type, filename as description, created_at, records_parsed::text as meta FROM file_uploads ORDER BY created_at DESC LIMIT 5)
      ORDER BY created_at DESC LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

module.exports = router;