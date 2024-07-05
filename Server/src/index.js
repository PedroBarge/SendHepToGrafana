/*
    ONLY RUN THIS CODE IF YOU HAVE THE SERVER IN YOUR LOCAL MACHINE
    
    This code is used to receive HEP packets from the server (Asterisk) and send them to the client via WebSocket.
 */

const udpServer = require('./udpServer');
const WebSocketServer = require('./webSocketServer');
const {UDP_PORT,UDP_HOST, WS_PORT} = require('./config');

udpServer.bind(UDP_PORT, UDP_HOST); 

WebSocketServer.listen(WS_PORT, () => {
    console.log(`WebSocket server running at http://localhost:${WS_PORT}`);
})