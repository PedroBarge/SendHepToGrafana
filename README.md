This documentation will explain how to configure Asterisk to send data and packets to the HEP server. It will also explain how to set up a HEP server from scratch.

All these configurations will be covered in a basic manner.

---

### How to create and configure Asterisk to send packets.

First, it is necessary to install Asterisk. Below is a brief step-by-step guide:

## Step 1 | Installation and configuration of Asterisk

Note: Installed on a Linux Ubuntu virtual machine

1. Ensure the PC server is updated and install dependencies (confirm versions)

```bash
sudo apt-get update
sudo apt-get install -y build-essential libncurses5-dev libssl-dev libxml2-dev libsqlite3-dev uuid-dev libedit-dev libjansson-dev
```

2. Go to the src directory of the machine to install Asterisk.

```bash
cd /usr/src
sudo wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
sudo tar zxvf astericdsk-20-current.tar.gz
cd asterisk-20.*
```

3. After downloading and extracting Asterisk, it's time to compile and install the app.

```bash
sudo ./configure # If any development package is missing, you will be notified here. If everything goes well
```

When installed successfully

```bash
sudo make menuselect # Optional, just to check if the correct packages are installed or add more
sudo make
sudo make install
# After installing
# These commands will already create .conf files of the above-selected packages
sudo make samples
sudo make config
sudo ldconfig
```

Installation was successful. The next step is to configure Asterisk.

```bash
cd /etc/asterisk
```

Now inside the Asterisk directory, we will start with a basic configuration to connect phones to the service.

Although we have several .conf files, we will only work with “extensions.conf”, “hep.conf”, and “pjsip.conf”.

Note: All documents are well documented and already have excellent examples that can be used by simply modifying them.

Before we start writing in the above files, I advise using the command:

```bash
sudo -s
```

This command activates the superuser, making code alterations easier.

1. We will create users to connect to our Asterisk. Let's open “pjsip.conf”:

```bash
nano pjsip.conf
```

Right at the beginning, we can uncomment the UDP transport 

```bash
[transport-udp]
type=transport
protocol=udp
bind0.0.0.0.0:5060
local_net = 192.168.0.0/24
```

Next, we can configure endpoints for pjsip phones

```bash
[utilizador1]
type=endpoint
context=from-external
disallow=all
allow=ulaw
transport=transport-udp
auth=utilizador1-auth
aors=utilizador1-aor

[utilizador1-auth]
type=auth
auth_type=userpass
password=123
username=utilizador1

[utilizador1-aor]
type=aor
max_contacts=1
#=================
[utilizador2]
type=endpoint
context=from-external
disallow=all
allow=ulaw
transport=transport-udp
auth=utilizador2-auth
aors=utilizador2-aor

[utilizador2-auth]
type=auth
auth_type=userpass
password=123
username=utilizador2

[utilizador2-aor]
type=aor
max_contacts=1
```

After writing this, save the document to proceed to “extensions.conf”.

In this document, we will create the context used for the users.

```bash
[from-external]
exten => utilizador1,1,Dial(PJSIP/utilizador1,20)
exten => utilizador1,n,Hangup()

exten => utilizador2,1,Dial(PJSIP/utilizador2,20)
exten => utilizador2,n,Hangup()
```

After writing this, save the document to proceed to “hep.conf”.

In this document, we will configure HEP

```bash
[general]
enable = yes
capture_address = 127.0.0.1:9060 # IP of the HEP server and port
capture_name = HOME # To make it easier to find the packets later
uuid_type = call-id
```

Now we can connect the phones to Asterisk, just run the command:

```jsx
asterisk -cvvv
```

## Step 2 | HEP server

I advise setting up the HEP server in the same environment where Asterisk was installed.

This server was made in NODE JS as there are [support libraries for this situation](https://www.npmjs.com/package/hep-js).

Before proceeding, please check that you have VisualStudio (or another interface capable of programming JavaScript), node, and npm installed.

Then, open VisualStudio to start building the server:

```jsx
npm init
// I used these libraries, please check if any are deprecated or if there is a better alternative
npm i dgram http socket.io hep-js
```

This server will be responsible for receiving and sending HEP packets from Asterisk.

We need to pay attention to the port and where the Asterisk server is hosted.

Again, this server was made in the same environment as Asterisk, so we use the IP 127.0.0.1

Let's first see what is needed for this information transition.

I advise starting from the simplest to the most complex.

Folder and document structure

```scss
- src/
  - app.js        
  - udpServer.js  
  - httpServer.js 
  - decoderHEP.js
  - config.js
```

I will start with decoderHEP.js as it is the simplest:

```jsx
import HEPjs from 'hep-js';

export function decodeHEPMessage(message) {
    const data = HEPjs.decapsulate(message);
    return { hep: data };
}
```

Using a function provided by the library, decoding the message becomes faster.

Moving on to udpServer.js and httpServer.js 

```jsx
import dgram from 'dgram';
import { decodeHEPMessage } from './hepHelper.js';
import { io } from './httpServer.js'; 

const udpServer = dgram.createSocket('udp4');

// Port and IP specified in the hep.conf of Asterisk
const UDP_PORT = 9060; 
const UDP_HOST = '127.0.0.1'; 

udpServer.on('message', (message) => {
    const hepData = decodeHEPMessage(message);
    console.log(`HEP packet received`);
   
    io.emit('hep', hepData);
});

udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`HEP server on ${address.address}:${address.port}`);
});

udpServer.on('error', (err) => {
    console.error(`UDP server error: ${err.stack}`);
    udpServer.close();
});

udpServer.bind(UDP_PORT, UDP_HOST);

export default udpServer;
```

Let's quickly create config.js to store the information about IPs and ports.

I recommend using .env files; for example, we'll use this

```jsx
export const UDP_PORT = 9060;
export const UDP_HOST = '192.168.2.235';
export const WS_PORT = 1234;
```

```jsx
import http from 'http';
import { Server } from 'socket.io';
import udpServer from './udpServer.js';

const app = http.createServer();

const io = new Server(app, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET","POST"]
    }
});

const WS_PORT = 1234;

app.listen(WS_PORT, () => {
    console.log(`WebSocket server running on http://localhost:${WS_PORT}`);
});

export { app, io };
```

And finally app.js

```jsx
// app.js
import http from 'http';
import { app } from './httpServer.js'; // Import 'app' from the HTTP server
import udpServer from './udpServer.js';

// Create the HTTP server
const httpServer = http.createServer(app);

export { app };
```

An important note in package.json, don't forget to add two important annotations, type and start.

Example:

```json
"type": "module",
"scripts": {
    "start": "node app.js"
}
```

This completes the configurations and code on the virtual machine side, and we can then start the configurations on the client side.

---

# Introduction and Initial Configuration on the Client Side / HEP Packet Receiver

On the client side, we will configure the reception of HEP packets, extract the most important information, and store it in a database to link it to Grafana.

In this example, I will use PostgreSQL to store the data.

Before starting, check if Docker, docker-compose, Node.js, npm, and an interface to connect with PostgreSQL (such as DBeaver) are installed on the client/host.

## Step 1 | docker-compose

In this example, I will use PostgreSQL 13 as it is the one I am most familiar with.

```yaml
volumes:
  postgres_data:

networks:
  grafanahep:
    driver: bridge

services:
  postgres:
    image: postgres:13
    container_name: ${Container_Name:-postgres}
    environment:
      POSTGRES_USER: ${Username:-postgres}
      POSTGRES_PASSWORD: ${User_Password:-postgres}
      POSTGRES_DB: ${Database_Name:-postgres}
    ports:
      - "5432:5432" # Default postgres

 port
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - grafanahep
```

In the same directory, create a .env file with:

```env
Container_Name=postgres
Username=postgres
User_Password=postgres
Database_Name=postgres
```

To start the database, navigate to the directory containing the docker-compose.yaml and run:

```bash
docker-compose up -d
```

This will start the PostgreSQL container in the background.

## Step 2 | Node.js

Now, we will create the server to receive the HEP packets, decode them, and store the information in the database.

Check if VisualStudio or another programming interface is installed, as well as Node.js and npm.

First, create a directory to work in:

```bash
mkdir grafanaHEP
cd grafanaHEP
```

In this directory, run:

```bash
npm init
```

For this example, I will use these libraries:

```bash
npm i dgram http socket.io pg
```

Once this is done, we will create a folder structure similar to the previous example:

```scss
- src/
  - app.js
  - udpServer.js
  - httpServer.js
  - hepHelper.js
  - db.js
  - config.js
```

I will follow the same logic as in the previous example, starting with the simplest files.

First, config.js:

```jsx
// config.js
export const UDP_PORT = 9060;
export const UDP_HOST = '192.168.2.235';
export const WS_PORT = 1234;
export const DB_CONFIG = {
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
};
```

Next, hepHelper.js:

```jsx
import HEPjs from 'hep-js';

export function decodeHEPMessage(message) {
    const data = HEPjs.decapsulate(message);
    return { hep: data };
}
```

And db.js to connect to PostgreSQL:

```jsx
import { Pool } from 'pg';
import { DB_CONFIG } from './config.js';

const pool = new Pool(DB_CONFIG);

export default pool;
```

Then, httpServer.js:

```jsx
import http from 'http';
import { Server } from 'socket.io';
import udpServer from './udpServer.js';

const app = http.createServer();

const io = new Server(app, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET","POST"]
    }
});

const WS_PORT = 1234;

app.listen(WS_PORT, () => {
    console.log(`WebSocket server running on http://localhost:${WS_PORT}`);
});

export { app, io };
```

And udpServer.js:

```jsx
import dgram from 'dgram';
import { decodeHEPMessage } from './hepHelper.js';
import pool from './db.js'; 
import { io } from './httpServer.js'; 

const udpServer = dgram.createSocket('udp4');

const UDP_PORT = 9060; 
const UDP_HOST = '192.168.2.235'; 

udpServer.on('message', async (message) => {
    const hepData = decodeHEPMessage(message);
    console.log(`HEP packet received`);

    io.emit('hep', hepData);

    const query = 'INSERT INTO hep_data (json_data) VALUES ($1)';
    await pool.query(query, [hepData]);
});

udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`HEP server on ${address.address}:${address.port}`);
});

udpServer.on('error', (err) => {
    console.error(`UDP server error: ${err.stack}`);
    udpServer.close();
});

udpServer.bind(UDP_PORT, UDP_HOST);

export default udpServer;
```

Finally, app.js:

```jsx
import http from 'http';
import { app } from './httpServer.js'; 
import udpServer from './udpServer.js'; 

const httpServer = http.createServer(app);

export { app };
```

Don't forget to add the necessary configurations to package.json:

```json
"type": "module",
"scripts": {
    "start": "node app.js"
}
```

Now, we need to configure the database table.

Connect to PostgreSQL using your preferred interface (e.g., DBeaver) and run:

```sql
CREATE TABLE hep_data (
    id SERIAL PRIMARY KEY,
    json_data JSONB
);
```

To run the server, navigate to the directory containing app.js and run:

```bash
npm start
```

Now you have a fully functional HEP packet receiver that stores data in PostgreSQL, ready to be linked to Grafana for visualization.

---
This concludes the basic setup for Asterisk and HEP server configurations and the client-side setup to receive, decode, and store HEP packets.


# Grafana Configuration

At the beginning of the last chapter, in the docker-compose, we already set up Grafana. Grafana is running on port 3000 and can be accessed via [http://localhost:3000](http://localhost:3000).

To log in, use "admin" for both the username and password.

![GrafanaLoginPage](https://github.com/PedroBarge/SendHepToGrafana/blob/main/imgs%20documentation/loginPage.png)

## Step 1 | Adding a Data Source to Grafana

Before adding a Data Source, we need to install a plugin.

On the left side, we have a vertical menu where we can select the plugins menu.

![GrafanaMenu](https://github.com/PedroBarge/SendHepToGrafana/blob/main/imgs%20documentation/menuPlugins.png)

In this menu, we need to search for the PostgreSQL plugin.

![GrafanaPluginSearch](https://github.com/PedroBarge/SendHepToGrafana/blob/main/imgs%20documentation/pluginPostegre.png)

By accessing PostgreSQL Core, we can already add the data source, and it will have several fields to fill in.

For example, we can choose a name in this field.

![PostegreSetup](https://github.com/PedroBarge/SendHepToGrafana/blob/main/imgs%20documentation/renameDataSource.png)

Next, we can fill in this information, but be careful that the data must match what is in docker-compose.

Note that the host URL must be with the Docker gateway (if you are using Docker).

![PostegreSetup](https://github.com/PedroBarge/SendHepToGrafana/blob/main/imgs%20documentation/editConnection.png)

If TLS is not configured, you can disable it.

To see the Docker gateway, you need to copy the container reference and write in the console:

```bash
docker inspect <Container_Reference>
```

Before confirming, check the version; when writing this, Grafana defaults to version 9 of PostgreSQL.

![PostegreSetup](https://github.com/PedroBarge/SendHepToGrafana/blob/main/imgs%20documentation/postegreVersion.png)

In the end, you will have a positive message regarding the connection from Grafana to PostgreSQL.

![FinalOk](https://github.com/PedroBarge/SendHepToGrafana/blob/main/imgs%20documentation/connetcionOk.png)

---
