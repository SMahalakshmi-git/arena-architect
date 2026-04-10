require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db/pool");

async function fix() {
  const hash = await bcrypt.hash("demo1234", 10);
  await pool.query(`UPDATE users SET password_hash = $1 WHERE email IN ('admin@arena.com', 'procurement@arena.com', 'pm@arena.com')`, [hash]);
  console.log("✅ Passwords updated!");
  process.exit();
}

fix().catch(err => { console.error(err); process.exit(1); });