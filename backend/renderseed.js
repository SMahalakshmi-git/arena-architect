require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: "postgresql://arena_architect_db_user:mCV3kvf6O86rzJktxeHGMFRVWrrtxoIp@dpg-d7ccdj5ckfvc738877e0-a.singapore-postgres.render.com/arena_architect_db",
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  // Create tables
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'procurement',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      region VARCHAR(100),
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      reliability_score DECIMAL(5,2) DEFAULT 0,
      total_deliveries INTEGER DEFAULT 0,
      on_time_deliveries INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      location VARCHAR(255),
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'active',
      total_budget DECIMAL(15,2),
      owner_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS materials (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      unit VARCHAR(50),
      quantity DECIMAL(15,2),
      estimated_unit_price DECIMAL(15,2),
      required_by DATE,
      priority VARCHAR(20) DEFAULT 'medium',
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS risk_alerts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      project_id UUID REFERENCES projects(id),
      material_id UUID REFERENCES materials(id),
      alert_type VARCHAR(50),
      severity VARCHAR(20) DEFAULT 'medium',
      message TEXT,
      region VARCHAR(100),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pricing_history (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      material_name VARCHAR(255),
      category VARCHAR(100),
      region VARCHAR(100),
      unit_price DECIMAL(15,2),
      recorded_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS file_uploads (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      project_id UUID REFERENCES projects(id),
      filename VARCHAR(255),
      file_type VARCHAR(50),
      uploaded_by UUID REFERENCES users(id),
      status VARCHAR(50) DEFAULT 'processing',
      records_parsed INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS supplier_recommendations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
      supplier_id UUID REFERENCES suppliers(id),
      supplier_name VARCHAR(255),
      unit_price DECIMAL(15,2),
      availability_score DECIMAL(5,2),
      delivery_days INTEGER,
      risk_level VARCHAR(20),
      price_trend VARCHAR(20),
      recommended BOOLEAN DEFAULT FALSE,
      cortex_score DECIMAL(5,2),
      fetched_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Seed users
  const hash = await bcrypt.hash("demo1234", 10);
  await pool.query(`
    INSERT INTO users (name, email, password_hash, role) VALUES
    ('Admin User', 'admin@arena.com', $1, 'admin'),
    ('Procurement Lead', 'procurement@arena.com', $1, 'procurement'),
    ('Project Manager', 'pm@arena.com', $1, 'project_manager')
    ON CONFLICT (email) DO UPDATE SET password_hash = $1
  `, [hash]);

  // Seed suppliers
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

    await pool.query(`
      INSERT INTO risk_alerts (project_id, alert_type, severity, message, region, is_read) VALUES
      ($1, 'price_spike', 'critical', 'Steel prices have risen 12.4% in South India region this week', 'South India', false),
      ($1, 'shortage', 'high', 'Cement availability critically low in Karnataka', 'Karnataka', false),
      ($1, 'delivery_delay', 'high', 'Supplier BuildPro Materials reporting 7-day delay on TMT bars', 'South India', false),
      ($1, 'price_spike', 'medium', 'Sand prices rising 5.2% across Maharashtra region', 'Maharashtra', false),
      ($1, 'supplier_risk', 'medium', 'Mumbai Metro Supplies reliability score dropped below 80%', 'Maharashtra', true),
      ($1, 'shortage', 'low', 'Aggregate stone supply tightening in Tamil Nadu region', 'Tamil Nadu', false)
      ON CONFLICT DO NOTHING
    `, [projectId]);
  }

  console.log("✅ Render database seeded successfully!");
  process.exit();
}

seed().catch(err => { console.error("❌ Failed:", err); process.exit(1); });