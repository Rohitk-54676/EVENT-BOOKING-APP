import pkg from "pg";
import "dotenv/config";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ✅ Proper connection test (no leak)
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("DB Connected");
  } catch (err) {
    console.error("DB Error:", err);
  }
})();

// ✅ MUST have this (you skipped it)
pool.on("error", (err) => {
  console.error("Unexpected DB error:", err);
});

export default pool;