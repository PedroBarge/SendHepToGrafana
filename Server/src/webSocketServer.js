const http = require('http');
const socketIo = require('socket.io');

const app = http.createServer();
const io = socketIo(app, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

module.exports = app;