/*
    ONLY RUN THIS CODE IF YOU HAVE THE SERVER IN YOUR LOCAL MACHINE
    
    This code is used to receive HEP packets from the server (Asterisk) and send them to the client via WebSocket.
 */

const dgram = require('dgram');
const http = require('http');
const socketIo = require('socket.io');
const HEPjs = require('hep-js');

const app = http.createServer();
const io = socketIo(app, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const udpServer = dgram.createSocket('udp4');

const UDP_PORT = 9060; 
const UDP_HOST = '127.0.0.1'; 

const WS_PORT = 1234;  

//This function is used to decode the HEP packets received from the server (Asterisk)
function decodeHEPMessage(message) {
    const data = HEPjs.decapsulate(message);
    console.log("HEPjs: ", data);
    return { hep: data };    
}

//This function is used to notify the server (Asterisk) that a HEP packet has been received
//And send the HEP packet to the client via WebSocket
udpServer.on('message', (message, remote) => {
    const hepData = decodeHEPMessage(message);
    console.log(`HEP packet received from ${remote.address}:${remote.port}`);

    io.emit('hep', hepData);
});

//This function is used to notify the server (Asterisk) that the UDP server has been started
udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`HEP server listening at ${address.address}:${address.port}`);
});


//This function is used to notify the server (Asterisk) that
udpServer.on('error', (err) => {
    console.error(`UDP server error: ${err.stack}`);
    udpServer.close();
});

udpServer.bind(UDP_PORT, UDP_HOST);

app.listen(WS_PORT, () => {
    console.log(`WebSocket server running at http://localhost:${WS_PORT}`);
});
