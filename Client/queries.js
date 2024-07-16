import { pool } from "./database.js";

export async function createJsonDataTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS json_data (
      id SERIAL PRIMARY KEY, 
      type VARCHAR, 
      rcinfo VARCHAR, 
      srcIp VARCHAR, 
      dstIp VARCHAR, 
      srcPort VARCHAR, 
      dstPort VARCHAR, 
      payload VARCHAR, 
      via VARCHAR, 
      call_id VARCHAR, 
      "from" VARCHAR, 
      "to" VARCHAR, 
      "date" VARCHAR, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    const result = await pool.query(queryText);
    console.log("Table created successfully");
  } catch (err) {
    console.error("Error creating table:", err);
  }
}
