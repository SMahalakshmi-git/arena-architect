require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db/pool");

async function seed() {
  const hash = await bcrypt.hash("demo1234", 10);

  await pool.query(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES
      ('Admin User', 'admin@arena.com', $1, 'admin'),
      ('Procurement User', 'procurement@arena.com', $1, 'procurement'),
      ('Project Manager', 'pm@arena.com', $1, 'project_manager')
    ON CONFLICT (email) DO NOTHING
  `, [hash]);

  console.log("✅ Demo users seeded!");
  process.exit();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});