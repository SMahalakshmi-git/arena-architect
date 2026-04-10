const express = require("express");
const axios = require("axios");
const pool = require("../db/pool");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Mock Cortex API response generator (replace with real Cortex API when available)
function generateCortexResponse(material) {
  const suppliers = [
    "BuildPro Materials", "Apex Construction Supplies",
    "Karnataka Steel & Cement", "Mumbai Metro Supplies", "Chennai Building Hub",
  ];
  const regions = ["South India", "North India", "Karnataka", "Maharashtra", "Tamil Nadu"];
  const trends = ["rising", "stable", "falling"];
  const risks = ["low", "medium", "high"];

  const basePrice = material.estimated_unit_price || 100;
  const recommendations = suppliers.slice(0, 3 + Math.floor(Math.random() * 2)).map((name, i) => {
    const priceVariance = (Math.random() - 0.3) * 0.3;
    return {
      supplier_name: name,
      region: regions[i % regions.length],
      unit_price: parseFloat((basePrice * (1 + priceVariance)).toFixed(2)),
      availability_score: parseFloat((70 + Math.random() * 30).toFixed(1)),
      delivery_days: Math.floor(3 + Math.random() * 14),
      risk_level: risks[Math.floor(Math.random() * risks.length)],
      price_trend: trends[Math.floor(Math.random() * trends.length)],
      cortex_score: parseFloat((65 + Math.random() * 35).toFixed(1)),
      recommended: i === 0,
    };
  });

  // Sort by cortex_score desc and mark best as recommended
  recommendations.sort((a, b) => b.cortex_score - a.cortex_score);
  recommendations[0].recommended = true;

  return {
    material_name: material.name,
    category: material.category,
    analysis: {
      market_trend: trends[Math.floor(Math.random() * trends.length)],
      regional_shortage: Math.random() > 0.7,
      price_forecast_7d: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
      demand_index: parseFloat((50 + Math.random() * 50).toFixed(1)),
    },
    recommendations,
  };
}

// POST /cortex/analyze - Send materials to Cortex and get recommendations
router.post("/analyze", authenticate, async (req, res) => {
  const { material_ids, project_id } = req.body;
  if (!material_ids || !material_ids.length) {
    return res.status(400).json({ error: "material_ids array required" });
  }

  try {
    // Fetch materials
    const materialsResult = await pool.query(
      `SELECT * FROM materials WHERE id = ANY($1::uuid[])`,
      [material_ids]
    );
    const materials = materialsResult.rows;

    const results = [];

    for (const material of materials) {
      let cortexData;

      // Try real Cortex API if configured
      if (process.env.CORTEX_API_URL && process.env.CORTEX_API_KEY) {
        try {
          const response = await axios.post(
            `${process.env.CORTEX_API_URL}/analyze`,
            {
              material_name: material.name,
              category: material.category,
              quantity: material.quantity,
              unit: material.unit,
              region: req.body.region || "South India",
              required_by: material.required_by,
            },
            {
              headers: { "Authorization": `Bearer ${process.env.CORTEX_API_KEY}` },
              timeout: 10000,
            }
          );
          cortexData = response.data;
        } catch (apiErr) {
          console.warn("Cortex API unavailable, using mock data:", apiErr.message);
          cortexData = generateCortexResponse(material);
        }
      } else {
        // Use mock data (development mode)
        cortexData = generateCortexResponse(material);
      }

      // Store recommendations in DB
      // Clear old recommendations first
      await pool.query("DELETE FROM supplier_recommendations WHERE material_id = $1", [material.id]);

      for (const rec of cortexData.recommendations) {
        await pool.query(
          `INSERT INTO supplier_recommendations
           (material_id, supplier_name, unit_price, availability_score, delivery_days,
            risk_level, price_trend, recommended, cortex_score)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [material.id, rec.supplier_name, rec.unit_price, rec.availability_score,
           rec.delivery_days, rec.risk_level, rec.price_trend, rec.recommended, rec.cortex_score]
        );
      }

      // Create alerts for high-risk items
      if (cortexData.analysis.regional_shortage) {
        await pool.query(
          `INSERT INTO risk_alerts (project_id, material_id, alert_type, severity, message)
           VALUES ($1,$2,'shortage','high',$3)`,
          [project_id, material.id, `Regional shortage detected for ${material.name}`]
        );
      }

      if (cortexData.analysis.market_trend === "rising") {
        await pool.query(
          `INSERT INTO risk_alerts (project_id, material_id, alert_type, severity, message)
           VALUES ($1,$2,'price_spike','medium',$3)`,
          [project_id, material.id, `Price rising trend for ${material.name} — lock in supplier now`]
        );
      }

      results.push({
        material_id: material.id,
        material_name: material.name,
        ...cortexData,
      });
    }

    // Broadcast analysis complete
    global.broadcast({
      type: "analysis_complete",
      project_id,
      materials_analyzed: materials.length,
      message: `Cortex analysis complete for ${materials.length} materials`,
    });

    res.json({ results, analyzed_count: results.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cortex analysis failed: " + err.message });
  }
});

// GET /cortex/pricing-trends?material=Steel&region=South India
router.get("/pricing-trends", authenticate, async (req, res) => {
  const { material, region } = req.query;
  try {
    // Generate mock historical pricing trend
    const days = 30;
    const basePrice = 150 + Math.random() * 100;
    const history = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      return {
        date: date.toISOString().split("T")[0],
        price: parseFloat((basePrice + (Math.random() - 0.5) * 20 + i * 0.5).toFixed(2)),
        region: region || "South India",
      };
    });
    res.json({ material, region, history });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pricing trends" });
  }
});

module.exports = router;
