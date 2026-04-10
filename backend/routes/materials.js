const express = require("express");
const pool = require("../db/pool");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /materials?project_id=xxx
router.get("/", authenticate, async (req, res) => {
  const { project_id } = req.query;
  try {
    let query = `
      SELECT m.*,
        COUNT(sr.id) as recommendation_count,
        MIN(sr.unit_price) as best_price,
        MAX(sr.cortex_score) as best_score
      FROM materials m
      LEFT JOIN supplier_recommendations sr ON sr.material_id = m.id
    `;
    const params = [];
    if (project_id) {
      query += " WHERE m.project_id = $1";
      params.push(project_id);
    }
    query += " GROUP BY m.id ORDER BY m.created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

// GET /materials/:id/recommendations
router.get("/:id/recommendations", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM supplier_recommendations WHERE material_id = $1 ORDER BY cortex_score DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// POST /materials
router.post("/", authenticate, async (req, res) => {
  const { project_id, name, category, unit, quantity, estimated_unit_price, required_by, priority } = req.body;
  if (!project_id || !name) return res.status(400).json({ error: "Project ID and name required" });
  try {
    const result = await pool.query(
      `INSERT INTO materials (project_id, name, category, unit, quantity, estimated_unit_price, required_by, priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [project_id, name, category, unit, quantity, estimated_unit_price, required_by, priority || "medium"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create material" });
  }
});

// PUT /materials/:id
router.put("/:id", authenticate, async (req, res) => {
  const { name, category, unit, quantity, estimated_unit_price, required_by, priority, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE materials SET name=$1, category=$2, unit=$3, quantity=$4,
       estimated_unit_price=$5, required_by=$6, priority=$7, status=$8
       WHERE id=$9 RETURNING *`,
      [name, category, unit, quantity, estimated_unit_price, required_by, priority, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update material" });
  }
});

// DELETE /materials/:id
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM materials WHERE id = $1", [req.params.id]);
    res.json({ message: "Material deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete material" });
  }
});

module.exports = router;
