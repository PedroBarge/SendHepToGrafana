/*
    ONLY RUN THIS CODE IF YOU HAVE THE SERVER IN YOUR LOCAL MACHINE
    
    This code is used to receive HEP packets from the server (Asterisk) and send them to the client via WebSocket.
 */

import { UDP_PORT, UDP_HOST, WS_PORT } from "./config.js";

import { udpServer } from "./udpServer.js";
import { app } from "./webSocketServer.js";

udpServer.bind(UDP_PORT, UDP_HOST);

app.listen(WS_PORT, () => {
  console.log(`WebSocket server running at http://localhost:${WS_PORT}`);
});
