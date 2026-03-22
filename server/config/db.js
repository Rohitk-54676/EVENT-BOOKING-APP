import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "eventapp",
  password: "3273",
  port: 1024,   // IMPORTANT (your custom port)
});

pool.connect()
  .then(() => console.log("DB Connected"))
  .catch(err => console.error("DB Error:", err));

export default pool;