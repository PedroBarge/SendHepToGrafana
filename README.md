HEP Server and Client
Overview
This project involves two main components:

HEP Server: This component runs alongside an Asterisk server (either in a VM or locally). It captures HEP (Homer Encapsulation Protocol) packets, transforms them into JSON format, and sends them to a client via WebSocket over UDP.

Client: This component connects to the WebSocket link provided by the HEP server, receives the JSON data, and stores the information in a PostgreSQL database.

Prerequisites
Server Side
Asterisk server running in a VM or locally
Node.js
npm (Node Package Manager)
Client Side
Node.js
npm (Node Package Manager)
PostgreSQL