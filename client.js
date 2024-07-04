import { io } from 'socket.io-client';
import pg from 'pg';
const{Pool} = pg;

const socket = io("http://192.168.2.235:1234"); 
const pool = new Pool({
  user: 'admin',
  host: 'localhost', 
  database: 'container',
  password: 'admin',
  port: 5432,
});

socket.on("connect", () => {
  console.log("Conectado ao servidor WebSocket");
});

socket.on("hep", async (message) => {
  try{
    const queryText = 'INSERT INTO json_data (data) VALUES ($1)';
    await pool.query(queryText, [message]);
    console.log("Dados salvos com sucesso:", message);
  }catch(err){
    console.error("Erro ao salvar dados:", err);
  }
});

socket.on("error", (error) => {
  console.log("Erro do servidor:", error);
});

socket.on("disconnect", () => {
  console.log("Desconectado do servidor WebSocket");
});

