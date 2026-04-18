const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: "postgresql://arena_architect_db_user:mCV3kvf6O86rzJktxeHGMFRVWrrtxoIp@dpg-d7ccdj5ckfvc738877e0-a.singapore-postgres.render.com/arena_architect_db",
  ssl: { rejectUnauthorized: false }
});

async function cleanReseed() {
  console.log("🧹 Force cleaning all tables...");

  await pool.query(`TRUNCATE TABLE supplier_recommendations, risk_alerts, file_uploads, materials, pricing_history, projects, suppliers, users RESTART IDENTITY CASCADE`);

  console.log("✅ All tables cleared!");

  // Seed users
  const hash = await bcrypt.hash("demo1234", 10);
  const userResult = await pool.query(`
    INSERT INTO users (name, email, password_hash, role) VALUES
    ('Admin User', 'admin@arena.com', $1, 'admin'),
    ('Procurement Lead', 'procurement@arena.com', $1, 'procurement'),
    ('Project Manager', 'pm@arena.com', $1, 'project_manager')
    RETURNING id
  `, [hash]);
  const adminId = userResult.rows[0].id;
  console.log("✅ Users seeded!");

  // Seed unique suppliers
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
  `);
  console.log("✅ Suppliers seeded!");

  // Seed 4 unique projects
  const p1 = await pool.query(`
    INSERT INTO projects (name, description, location, start_date, end_date, status, total_budget, owner_id)
    VALUES ('APK Building Construction', 'Commercial building construction project in Bangalore', 'Bangalore, Karnataka', '2024-01-15', '2025-06-30', 'active', 45000000, $1)
    RETURNING id`, [adminId]);

  const p2 = await pool.query(`
    INSERT INTO projects (name, description, location, start_date, end_date, status, total_budget, owner_id)
    VALUES ('Highway Bridge Project', 'National highway bridge expansion project', 'Mysore, Karnataka', '2024-03-01', '2025-12-31', 'active', 82000000, $1)
    RETURNING id`, [adminId]);

  const p3 = await pool.query(`
    INSERT INTO projects (name, description, location, start_date, end_date, status, total_budget, owner_id)
    VALUES ('Residential Complex Alpha', 'Premium residential complex with 200 units', 'Chennai, Tamil Nadu', '2024-02-10', '2026-01-15', 'active', 120000000, $1)
    RETURNING id`, [adminId]);

  const p4 = await pool.query(`
    INSERT INTO projects (name, description, location, start_date, end_date, status, total_budget, owner_id)
    VALUES ('Metro Station Renovation', 'Underground metro station renovation work', 'Hyderabad, Telangana', '2024-04-01', '2025-09-30', 'active', 65000000, $1)
    RETURNING id`, [adminId]);

  const pid1 = p1.rows[0].id;
  const pid2 = p2.rows[0].id;
  const pid3 = p3.rows[0].id;
  const pid4 = p4.rows[0].id;
  console.log("✅ Projects seeded!");

  // Materials for APK Building Construction
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
  `, [pid1]);

  // Materials for Highway Bridge Project
  await pool.query(`
    INSERT INTO materials (project_id, name, category, unit, quantity, estimated_unit_price, priority, status) VALUES
    ($1, 'Bridge Steel Girders', 'Steel', 'MT', 820, 75000, 'critical', 'pending'),
    ($1, 'High Strength Concrete', 'Cement', 'M3', 3500, 6500, 'high', 'ordered'),
    ($1, 'Reinforcement Bars', 'Steel', 'MT', 340, 60000, 'high', 'pending'),
    ($1, 'Waterproofing Membrane', 'Chemical', 'SQM', 2800, 450, 'medium', 'pending'),
    ($1, 'Expansion Joints', 'Hardware', 'MTR', 180, 8500, 'medium', 'pending')
  `, [pid2]);

  // Materials for Residential Complex Alpha
  await pool.query(`
    INSERT INTO materials (project_id, name, category, unit, quantity, estimated_unit_price, priority, status) VALUES
    ($1, 'Fly Ash Bricks', 'Masonry', 'NOS', 85000, 8, 'medium', 'pending'),
    ($1, 'Floor Tiles 600x600', 'Finishing', 'SQM', 4200, 850, 'low', 'pending'),
    ($1, 'UPVC Windows', 'Fixtures', 'NOS', 640, 12000, 'high', 'pending'),
    ($1, 'Plumbing Fixtures', 'Plumbing', 'SET', 200, 25000, 'medium', 'pending')
  `, [pid3]);

  // Materials for Metro Station Renovation
  await pool.query(`
    INSERT INTO materials (project_id, name, category, unit, quantity, estimated_unit_price, priority, status) VALUES
    ($1, 'Granite Flooring', 'Finishing', 'SQM', 3800, 1200, 'high', 'pending'),
    ($1, 'Steel Columns', 'Steel', 'MT', 120, 68000, 'critical', 'pending'),
    ($1, 'Fire Resistant Panels', 'Safety', 'SQM', 1500, 2800, 'high', 'pending'),
    ($1, 'LED Lighting Systems', 'Electrical', 'SET', 450, 8500, 'medium', 'pending')
  `, [pid4]);
  console.log("✅ Materials seeded!");

  // Risk alerts for each project
  await pool.query(`
    INSERT INTO risk_alerts (project_id, alert_type, severity, message, region, is_read) VALUES
    ($1, 'price_spike', 'critical', 'Steel prices have risen 12.4% in South India this week', 'South India', false),
    ($1, 'shortage', 'high', 'Cement availability critically low in Karnataka', 'Karnataka', false),
    ($2, 'delivery_delay', 'high', 'BuildPro Materials reporting 7-day delay on steel girders', 'South India', false),
    ($2, 'price_spike', 'medium', 'Concrete prices rising 5.2% across Karnataka region', 'Karnataka', false),
    ($3, 'supplier_risk', 'medium', 'Mumbai Metro Supplies reliability score dropped below 80%', 'Maharashtra', false),
    ($3, 'shortage', 'low', 'Brick supply tightening in Tamil Nadu region', 'Tamil Nadu', false),
    ($4, 'price_spike', 'high', 'Granite prices spiking 8.3% in Telangana region', 'Telangana', false),
    ($4, 'delivery_delay', 'medium', 'Steel column delivery delayed by 5 days from supplier', 'Telangana', false)
  `, [pid1, pid2, pid3, pid4]);
  console.log("✅ Alerts seeded!");

  console.log("🎉 All done! Database is clean and seeded with unique data!");
  process.exit();
}

cleanReseed().catch(err => { console.error("❌ Failed:", err); process.exit(1); });