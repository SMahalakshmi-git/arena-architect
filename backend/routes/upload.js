const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const pool = require("../db/pool");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".csv", ".xlsx", ".xls", ".json"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only CSV, Excel, and JSON files allowed"));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Parse materials from rows
async function parseMaterialsFromRows(rows, projectId) {
  const materials = [];
  for (const row of rows) {
    const name = row["Material Name"] || row["material_name"] || row["Name"] || row["name"];
    if (!name) continue;

    const material = {
      project_id: projectId,
      name: String(name).trim(),
      category: row["Category"] || row["category"] || "General",
      unit: row["Unit"] || row["unit"] || "nos",
      quantity: parseFloat(row["Quantity"] || row["quantity"] || 0),
      estimated_unit_price: parseFloat(row["Unit Price"] || row["unit_price"] || row["Price"] || 0),
      required_by: row["Required By"] || row["required_by"] || null,
      priority: (row["Priority"] || row["priority"] || "medium").toLowerCase(),
    };

    const result = await pool.query(
      `INSERT INTO materials (project_id, name, category, unit, quantity, estimated_unit_price, required_by, priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [material.project_id, material.name, material.category, material.unit,
       material.quantity, material.estimated_unit_price, material.required_by, material.priority]
    );
    materials.push(result.rows[0]);
  }
  return materials;
}

// POST /upload/boq
router.post("/boq", authenticate, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { project_id } = req.body;
  if (!project_id) return res.status(400).json({ error: "project_id required" });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filePath = req.file.path;

  try {
    let rows = [];

    if (ext === ".csv") {
      rows = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => results.push(data))
          .on("end", () => resolve(results))
          .on("error", reject);
      });
    } else if (ext === ".xlsx" || ext === ".xls") {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else if (ext === ".json") {
      const content = fs.readFileSync(filePath, "utf8");
      rows = JSON.parse(content);
      if (!Array.isArray(rows)) rows = [rows];
    }

    // Log upload
    const uploadLog = await pool.query(
      `INSERT INTO file_uploads (project_id, filename, file_type, uploaded_by, status, records_parsed)
       VALUES ($1,$2,$3,$4,'processing',$5) RETURNING id`,
      [project_id, req.file.originalname, ext, req.user.id, rows.length]
    );

    const materials = await parseMaterialsFromRows(rows, project_id);

    // Update upload log
    await pool.query(
      "UPDATE file_uploads SET status='completed', records_parsed=$1 WHERE id=$2",
      [materials.length, uploadLog.rows[0].id]
    );

    // Clean up file
    fs.unlinkSync(filePath);

    // Broadcast live update
    global.broadcast({
      type: "upload_complete",
      project_id,
      materials_parsed: materials.length,
      message: `${materials.length} materials parsed from ${req.file.originalname}`,
    });

    res.json({
      message: "File processed successfully",
      records_parsed: materials.length,
      materials,
    });
  } catch (err) {
    console.error(err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: "File processing failed: " + err.message });
  }
});

module.exports = router;
