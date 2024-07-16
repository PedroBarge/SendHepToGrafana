import { io } from "socket.io-client";

const socket = io("http://192.168.2.235:1234");

export default socket;