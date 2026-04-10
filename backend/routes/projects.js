const express = require("express");
const pool = require("../db/pool");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /projects
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as owner_name,
        COUNT(DISTINCT m.id) as material_count,
        COUNT(DISTINCT ra.id) as alert_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN materials m ON m.project_id = p.id
      LEFT JOIN risk_alerts ra ON ra.project_id = p.id AND ra.is_read = false
      GROUP BY p.id, u.name
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// GET /projects/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as owner_name FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Project not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// POST /projects
router.post("/", authenticate, async (req, res) => {
  const { name, description, location, start_date, end_date, total_budget } = req.body;
  if (!name) return res.status(400).json({ error: "Project name required" });
  try {
    const result = await pool.query(
      `INSERT INTO projects (name, description, location, start_date, end_date, total_budget, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, description, location, start_date, end_date, total_budget, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create project" });
  }
});

// PUT /projects/:id
router.put("/:id", authenticate, async (req, res) => {
  const { name, description, location, start_date, end_date, total_budget, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE projects SET name=$1, description=$2, location=$3, start_date=$4,
       end_date=$5, total_budget=$6, status=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, description, location, start_date, end_date, total_budget, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update project" });
  }
});

// DELETE /projects/:id
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]);
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

module.exports = router;
