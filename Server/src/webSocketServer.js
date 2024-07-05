import http from "http";
import {Server} from "socket.io";

export const app = http.createServer();
export const io = new Server(app, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
