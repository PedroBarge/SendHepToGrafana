import dgram from "dgram";

import { io } from "./webSocketServer.js";
import { decodeHEPMessage } from "./hepDecoder.js";
export const udpServer = dgram.createSocket("udp4");

udpServer.on("message", (message) => {
  const hepData = decodeHEPMessage(message);
  io.emit("hep", hepData);
});

udpServer.on("listening", () => {
  const address = udpServer.address();
  console.log(`HEP UDP server listening at ${address.address}:${address.port}`);
});

udpServer.on("error", (err) => {
  console.error(`UDP server error: ${err.stack}`);
  udpServer.close();
});
