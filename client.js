import { io } from "socket.io-client";
import pg from "pg";
const { Pool } = pg;

const socket = io("http://192.168.2.235:1234");
const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "container",
  password: "admin",
  port: 5432,
});

socket.on("connect", () => {
  console.log("Conectado ao servidor WebSocket");
  const queryText
   = 'CREATE TABLE IF NOT EXISTS json_data (id SERIAL PRIMARY KEY, rcinfo VARCHAR, srcIp VARCHAR, dstIp VARCHAR, srcPort VARCHAR, dstPort VARCHAR, payload VARCHAR, via VARCHAR, call_id VARCHAR, "from" VARCHAR, "to" VARCHAR, "date" VARCHAR, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);';
  pool.query(queryText);
});

socket.on("hep", async (message) => {
  //
  const { hep } = message;
  const {rcinfo, payload} = hep;
  const {srcPort, dstPort, srcIp, dstIp} = rcinfo;

  const via = extractFieldFromPayload(payload, 'Via');
  const call_id = extractFieldFromPayload(payload, 'Call-ID');
  const from = extractFieldFromPayload(payload, 'From');
  const to = extractFieldFromPayload(payload, 'To');
  const date = extractFieldFromPayload(payload, 'Date');

  const queryText = 'INSERT INTO json_data (rcinfo, srcIp, dstIp, srcPort, dstPort, payload, via, call_id, "from", "to", "date") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)';

  try {
    await pool.query(queryText, [rcinfo, srcIp, dstIp, srcPort, dstPort, payload, via, call_id, from, to, date]);
    console.log("Dados salvos com sucesso:", message);
  } catch (err) {
    console.error("Erro ao salvar dados:", err);
  }
});

socket.on("error", (error) => {
  console.log("Erro do servidor:", error);
});

socket.on("disconnect", () => {
  console.log("Desconectado do servidor WebSocket");
});

function extractFieldFromPayload(payload, fieldName) {
  const regex = new RegExp(`${fieldName}:\\s*(.*)`, 'i');
  const match = payload.match(regex);
  return match ? match[1].trim() : null;
}