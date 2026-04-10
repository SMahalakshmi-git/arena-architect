require("dotenv").config();
const pool = require("./db/pool");

async function fixSuppliers() {
  // Delete all existing suppliers
  await pool.query(`DELETE FROM suppliers`);

  // Insert unique suppliers with variety
  await pool.query(`
    INSERT INTO suppliers (name, region, contact_email, contact_phone, reliability_score, total_deliveries, on_time_deliveries) VALUES
    ('Karnataka Steel & Cement', 'Karnataka', 'sales@ksccement.com', '+91-80-4521-7890', 95.10, 670, 637),
    ('BuildPro Materials', 'South India', 'contact@buildpro.in', '+91-44-3821-5670', 92.50, 450, 416),
    ('Chennai Building Hub', 'Tamil Nadu', 'info@chennaibuild.com', '+91-44-2891-3456', 88.70, 380, 337),
    ('Apex Construction Supplies', 'North India', 'apex@construction.in', '+91-11-4567-8901', 87.30, 320, 279),
    ('Mumbai Metro Supplies', 'Maharashtra', 'metro@mumbaisupplies.com', '+91-22-6789-0123', 81.20, 290, 235),
    ('Hyderabad Infra Materials', 'Telangana', 'sales@hydinfra.com', '+91-40-2345-6789', 90.40, 510, 461),
    ('Delhi NCR Builders Supply', 'North India', 'info@delhibuilders.com', '+91-11-9876-5432', 84.60, 410, 347),
    ('Pune Construction Hub', 'Maharashtra', 'contact@puneconstruct.com', '+91-20-5678-9012', 86.20, 355, 306),
    ('Coimbatore Steel Works', 'Tamil Nadu', 'sales@cbrsteel.com', '+91-422-234-5678', 91.80, 480, 441),
    ('Bengaluru Build Supplies', 'Karnataka', 'info@blrbuild.com', '+91-80-3456-7890', 93.30, 560, 522)
    ON CONFLICT DO NOTHING
  `);

  console.log("✅ Suppliers fixed — 10 unique suppliers added!");
  process.exit();
}

fixSuppliers().catch(err => { console.error("❌ Failed:", err); process.exit(1); });