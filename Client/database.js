import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "container",
  password: "admin",
  port: 5432,
});

