const express = require("express");
const pool = require("../db/pool");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /suppliers
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *, 
        ROUND((on_time_deliveries::decimal / NULLIF(total_deliveries, 0)) * 100, 1) as on_time_rate
      FROM suppliers ORDER BY reliability_score DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

// GET /suppliers/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM suppliers WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Supplier not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
});

// POST /suppliers
router.post("/", authenticate, async (req, res) => {
  const { name, region, contact_email, contact_phone, reliability_score } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO suppliers (name, region, contact_email, contact_phone, reliability_score)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, region, contact_email, contact_phone, reliability_score || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

module.exports = router;
