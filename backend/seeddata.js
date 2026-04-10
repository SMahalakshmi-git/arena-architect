require("dotenv").config();
const pool = require("./db/pool");

async function seedData() {

  // Get admin user id
  const userResult = await pool.query(`SELECT id FROM users WHERE email = 'admin@arena.com'`);
  const adminId = userResult.rows[0].id;

  // Seed projects
  const projectResult = await pool.query(`
    INSERT INTO projects (name, description, location, start_date, end_date, status, total_budget, owner_id) VALUES
    ('APK Building Construction', 'Commercial building construction project in Bangalore', 'Bangalore, Karnataka', '2024-01-15', '2025-06-30', 'active', 45000000, $1),
    ('Highway Bridge Project', 'National highway bridge expansion project', 'Mysore, Karnataka', '2024-03-01', '2025-12-31', 'active', 82000000, $1),
    ('Residential Complex Alpha', 'Premium residential complex with 200 units', 'Chennai, Tamil Nadu', '2024-02-10', '2026-01-15', 'active', 120000000, $1)
    ON CONFLICT DO NOTHING
    RETURNING id
  `, [adminId]);

  const projectId = projectResult.rows[0]?.id;

  if (projectId) {
    // Seed materials
    await pool.query(`
      INSERT INTO materials (project_id, name, category, unit, quantity, estimated_unit_price, priority, status) VALUES
      ($1, 'TMT Steel Bars', 'Steel', 'MT', 450, 58000, 'critical', 'pending'),
      ($1, 'Portland Cement', 'Cement', 'Bags', 12000, 380, 'high', 'pending'),
      ($1, 'River Sand', 'Aggregates', 'CFT', 8500, 45, 'high', 'ordered'),
      ($1, 'Crushed Stone 20mm', 'Aggregates', 'CFT', 11000, 38, 'medium', 'pending'),
      ($1, 'AAC Blocks', 'Masonry', 'CBM', 620, 4200, 'medium', 'pending'),
      ($1, 'Structural Steel', 'Steel', 'MT', 85, 72000, 'critical', 'pending'),
      ($1, 'PVC Pipes 4 inch', 'Plumbing', 'MTR', 2400, 320, 'low', 'pending'),
      ($1, 'Electrical Conduits', 'Electrical', 'MTR', 3200, 85, 'low', 'pending')
      ON CONFLICT DO NOTHING
    `, [projectId]);
  }

  // Seed risk alerts
  await pool.query(`
    INSERT INTO risk_alerts (project_id, alert_type, severity, message, region, is_read) VALUES
    ($1, 'price_spike', 'critical', 'Steel prices have risen 12.4% in South India region this week', 'South India', false),
    ($1, 'shortage', 'high', 'Cement availability critically low in Karnataka — only 3 suppliers active', 'Karnataka', false),
    ($1, 'delivery_delay', 'high', 'Supplier BuildPro Materials reporting 7-day delay on TMT bars delivery', 'South India', false),
    ($1, 'price_spike', 'medium', 'Sand prices rising 5.2% across Maharashtra region', 'Maharashtra', false),
    ($1, 'supplier_risk', 'medium', 'Mumbai Metro Supplies reliability score dropped below 80%', 'Maharashtra', true),
    ($1, 'shortage', 'low', 'Aggregate stone supply tightening in Tamil Nadu region', 'Tamil Nadu', false)
    ON CONFLICT DO NOTHING
  `, [projectId]);

  // Seed pricing history
  await pool.query(`
    INSERT INTO pricing_history (material_name, category, region, unit_price) VALUES
    ('TMT Steel Bars', 'Steel', 'South India', 58000),
    ('TMT Steel Bars', 'Steel', 'South India', 56500),
    ('Portland Cement', 'Cement', 'Karnataka', 380),
    ('Portland Cement', 'Cement', 'Karnataka', 365),
    ('River Sand', 'Aggregates', 'Karnataka', 45),
    ('Crushed Stone 20mm', 'Aggregates', 'Karnataka', 38)
    ON CONFLICT DO NOTHING
  `);

  console.log("✅ All demo data seeded successfully!");
  process.exit();
}

seedData().catch(err => { console.error("❌ Failed:", err); process.exit(1); });