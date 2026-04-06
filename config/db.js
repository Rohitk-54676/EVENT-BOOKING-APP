import pkg from "pg";
import "dotenv/config";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("DB Connected"))
  .catch(err => console.error("DB Error:", err));

export default pool;